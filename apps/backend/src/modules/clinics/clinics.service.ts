import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Clinic, ClinicStatus } from './clinic.entity';
import { SearchClinicsDto, CreateClinicDto, UpdateClinicDto } from './dto/clinic.dto';
import { User } from '../auth/user.entity';
import { UserRole } from '../../common/decorators';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

@Injectable()
export class ClinicsService {
  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepo: Repository<Clinic>,
  ) {}

  // ─── SEARCH ───────────────────────────────────────────────────────────────

  async search(dto: SearchClinicsDto): Promise<PaginatedResult<Clinic>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.clinicRepo
      .createQueryBuilder('clinic')
      .leftJoinAndSelect('clinic.owner', 'owner')
      .where('clinic.status = :status', { status: ClinicStatus.ACTIVE })
      .andWhere('clinic.deleted_at IS NULL');

    this.applyFilters(qb, dto);
    this.applySorting(qb, dto.sortBy);

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  private applyFilters(qb: SelectQueryBuilder<Clinic>, dto: SearchClinicsDto) {
    if (dto.q) {
      qb.andWhere(
        `(clinic.name ILIKE :q OR clinic.name_ar ILIKE :q OR clinic.area ILIKE :q)`,
        { q: `%${dto.q}%` },
      );
    }

    if (dto.emirate) {
      qb.andWhere('clinic.emirate = :emirate', { emirate: dto.emirate });
    }

    if (dto.specialties?.length) {
      // Filter clinics that have any of the requested specialties
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM unnest(clinic.specialties) spec
          WHERE spec ILIKE ANY(:specialties)
        )`,
        { specialties: dto.specialties.map((s) => `%${s}%`) },
      );
    }

    if (dto.minRating) {
      qb.andWhere('clinic.rating_avg >= :minRating', { minRating: dto.minRating });
    }

    if (dto.language) {
      qb.andWhere(':language = ANY(clinic.languages)', { language: dto.language });
    }

    if (dto.verifiedOnly) {
      qb.andWhere('clinic.is_admin_verified = true');
    }
  }

  private applySorting(qb: SelectQueryBuilder<Clinic>, sortBy?: string) {
    switch (sortBy) {
      case 'rating':
        qb.orderBy('clinic.rating_avg', 'DESC').addOrderBy('clinic.review_count', 'DESC');
        break;
      case 'newest':
        qb.orderBy('clinic.created_at', 'DESC');
        break;
      default:
        // "Best match" — verified first, then by rating
        qb.orderBy('clinic.is_admin_verified', 'DESC')
          .addOrderBy('clinic.rating_avg', 'DESC')
          .addOrderBy('clinic.booking_count', 'DESC');
    }
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<Clinic> {
    const clinic = await this.clinicRepo.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!clinic) throw new NotFoundException(`Clinic ${id} not found`);
    return clinic;
  }

  async findBySlug(slug: string): Promise<Clinic> {
    const clinic = await this.clinicRepo.findOne({
      where: { slug, status: ClinicStatus.ACTIVE },
      relations: ['owner'],
    });
    if (!clinic) throw new NotFoundException(`Clinic '${slug}' not found`);
    return clinic;
  }

  async create(dto: CreateClinicDto, owner: User): Promise<Clinic> {
    const slug = await this.generateUniqueSlug(dto.name);

    const clinic = this.clinicRepo.create({
      ...dto,
      slug,
      ownerId: owner.id,
      status: ClinicStatus.PENDING_REVIEW,
    });

    return this.clinicRepo.save(clinic);
  }

  async update(id: string, dto: UpdateClinicDto, user: User): Promise<Clinic> {
    const clinic = await this.findOne(id);
    this.assertOwnerOrAdmin(clinic, user);
    Object.assign(clinic, dto);
    return this.clinicRepo.save(clinic);
  }

  async delete(id: string, user: User): Promise<void> {
    const clinic = await this.findOne(id);
    this.assertOwnerOrAdmin(clinic, user);
    await this.clinicRepo.softDelete(id);
  }

  async getMyClinic(ownerId: string): Promise<Clinic | null> {
    return this.clinicRepo.findOne({ where: { ownerId } });
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────────────

  async verify(id: string, adminUser: User): Promise<Clinic> {
    const clinic = await this.findOne(id);
    clinic.isAdminVerified = true;
    clinic.verifiedAt = new Date();
    clinic.status = ClinicStatus.ACTIVE;
    return this.clinicRepo.save(clinic);
  }

  // ─── RATING UPDATE (called by reviews service) ───────────────────────────

  async refreshRating(clinicId: string): Promise<void> {
    const result = await this.clinicRepo
      .createQueryBuilder('clinic')
      .select('AVG(r.rating_overall)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .leftJoin('reviews', 'r', 'r.clinic_id = clinic.id AND r.is_approved = true AND r.deleted_at IS NULL')
      .where('clinic.id = :clinicId', { clinicId })
      .getRawOne();

    await this.clinicRepo.update(clinicId, {
      ratingAvg: parseFloat(result.avg) || 0,
      reviewCount: parseInt(result.count) || 0,
    });
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private assertOwnerOrAdmin(clinic: Clinic, user: User) {
    if (user.role === UserRole.ADMIN) return;
    if (clinic.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this clinic');
    }
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    let slug = base;
    let counter = 1;

    while (await this.clinicRepo.findOne({ where: { slug }, withDeleted: true })) {
      slug = `${base}-${counter++}`;
    }

    return slug;
  }
}
