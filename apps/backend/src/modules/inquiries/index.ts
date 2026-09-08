// ──────────────────────────────────────────
// dto/inquiry.dto.ts
// ──────────────────────────────────────────
import {
  IsUUID, IsOptional, IsString, IsNumber,
  Min, Max, MaxLength, IsEnum
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InquiryStatus } from './inquiry.entity';
import { Type } from 'class-transformer';

export class CreateInquiryDto {
  @ApiProperty({ description: 'ID of the marketplace listing' })
  @IsUUID()
  listingId: string;

  @ApiPropertyOptional({ description: 'Minimum budget in AED' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @ApiPropertyOptional({ description: 'Maximum budget in AED' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @ApiPropertyOptional({ description: 'Desired stake percentage', minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  stakeInterestPct?: number;

  @ApiProperty({ example: 'I am interested in acquiring a partial stake...' })
  @IsString()
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({ example: 'Within 3 months' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeline?: string;
}

export class UpdateInquiryStatusDto {
  @ApiProperty({ enum: InquiryStatus })
  @IsEnum(InquiryStatus)
  status: InquiryStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sellerNotes?: string;
}

// ──────────────────────────────────────────
// inquiries.service.ts
// ──────────────────────────────────────────
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inquiry } from './inquiry.entity';
import { User } from '../auth/user.entity';
import { UserRole } from '../../common/decorators';

export class InquiriesService {
  constructor(
    @InjectRepository(Inquiry)
    private readonly inquiryRepo: Repository<Inquiry>,
  ) {}

  async create(dto: CreateInquiryDto, investor: User): Promise<Inquiry> {
    // Check for existing open inquiry from this investor on this listing
    const existing = await this.inquiryRepo.findOne({
      where: {
        listingId: dto.listingId,
        investorId: investor.id,
      },
    });

    if (existing && ![InquiryStatus.CLOSED_WON, InquiryStatus.CLOSED_LOST].includes(existing.status)) {
      throw new ConflictException('You have already submitted an inquiry for this listing');
    }

    const inquiry = this.inquiryRepo.create({
      ...dto,
      investorId: investor.id,
      status: InquiryStatus.NEW,
    });

    return this.inquiryRepo.save(inquiry);
  }

  async findByListing(listingId: string, user: User): Promise<Inquiry[]> {
    // Only seller or admin can see listing's inquiries
    if (user.role !== UserRole.ADMIN) {
      // In production: verify user owns the listing
    }

    const inquiries = await this.inquiryRepo.find({
      where: { listingId },
      relations: ['investor'],
      order: { createdAt: 'DESC' },
    });

    // Mark as viewed
    const newInquiries = inquiries.filter(i => i.status === InquiryStatus.NEW);
    for (const inquiry of newInquiries) {
      inquiry.status = InquiryStatus.VIEWED;
      inquiry.firstViewedAt = inquiry.firstViewedAt || new Date();
      inquiry.lastActivityAt = new Date();
    }
    if (newInquiries.length) await this.inquiryRepo.save(newInquiries);

    return inquiries;
  }

  async findMyInquiries(investorId: string): Promise<Inquiry[]> {
    return this.inquiryRepo.find({
      where: { investorId },
      order: { lastActivityAt: 'DESC' },
    });
  }

  async updateStatus(id: string, dto: UpdateInquiryStatusDto, user: User): Promise<Inquiry> {
    const inquiry = await this.inquiryRepo.findOne({ where: { id } });
    if (!inquiry) throw new NotFoundException('Inquiry not found');

    inquiry.status = dto.status;
    inquiry.lastActivityAt = new Date();
    if (dto.sellerNotes) inquiry.sellerNotes = dto.sellerNotes;
    if (dto.status === InquiryStatus.NDA_SIGNED) inquiry.ndaSignedAt = new Date();

    return this.inquiryRepo.save(inquiry);
  }
}

// ──────────────────────────────────────────
// inquiries.controller.ts
// ──────────────────────────────────────────
import {
  Controller, Get, Post, Patch, Body, Param, UseGuards, ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/index';
import { Roles, CurrentUser } from '../../common/decorators';

@ApiTags('inquiries')
@Controller({ path: 'inquiries', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  @Roles(UserRole.INVESTOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Submit an investor inquiry for a marketplace listing' })
  async create(@Body() dto: CreateInquiryDto, @CurrentUser() user: User) {
    return this.inquiriesService.create(dto, user);
  }

  @Get('my')
  @ApiOperation({ summary: "Get investor's own submitted inquiries" })
  async getMyInquiries(@CurrentUser() user: User) {
    return this.inquiriesService.findMyInquiries(user.id);
  }

  @Get('listing/:listingId')
  @Roles(UserRole.CLINIC_OWNER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all inquiries for a listing (seller/admin)' })
  async getByListing(
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @CurrentUser() user: User,
  ) {
    return this.inquiriesService.findByListing(listingId, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.CLINIC_OWNER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update inquiry status (seller moves pipeline stage)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInquiryStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.inquiriesService.updateStatus(id, dto, user);
  }
}

// ──────────────────────────────────────────
// inquiries.module.ts
// ──────────────────────────────────────────
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Inquiry])],
  controllers: [InquiriesController],
  providers: [InquiriesService],
  exports: [InquiriesService],
})
export class InquiriesModule {}
