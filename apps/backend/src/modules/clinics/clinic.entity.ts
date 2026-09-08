import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Check,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../auth/user.entity';

export enum ClinicStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
}

export enum Emirate {
  DUBAI = 'dubai',
  ABU_DHABI = 'abu_dhabi',
  SHARJAH = 'sharjah',
  AJMAN = 'ajman',
  UMM_AL_QUWAIN = 'umm_al_quwain',
  FUJAIRAH = 'fujairah',
  RAS_AL_KHAIMAH = 'ras_al_khaimah',
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

@Entity('clinics')
@Index(['status'])
@Index(['emirate'])
@Index(['ratingAvg'])
@Index(['slug'], { unique: true, where: '"deleted_at" IS NULL' })
export class Clinic extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'name_ar', length: 255, nullable: true })
  nameAr?: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr?: string;

  @Column({
    type: 'enum',
    enum: ClinicStatus,
    default: ClinicStatus.DRAFT,
  })
  status: ClinicStatus;

  // Location
  @Column({ type: 'enum', enum: Emirate })
  emirate: Emirate;

  @Column({ name: 'address_line1', nullable: true })
  addressLine1?: string;

  @Column({ nullable: true })
  area?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  // Contact
  @Column({ nullable: true, length: 20 })
  phone?: string;

  @Column({ nullable: true, length: 20 })
  whatsapp?: string;

  @Column({ type: 'citext', nullable: true })
  email?: string;

  @Column({ nullable: true })
  website?: string;

  // Regulatory
  @Column({ name: 'dha_license_no', nullable: true })
  dhaLicenseNo?: string;

  @Column({ name: 'moh_license_no', nullable: true })
  mohLicenseNo?: string;

  @Column({ name: 'is_admin_verified', default: false })
  isAdminVerified: boolean;

  @Column({ name: 'verified_at', nullable: true, type: 'timestamptz' })
  verifiedAt?: Date;

  // Specialties — stored as array for simplicity (normalized M2M in v2)
  @Column({ type: 'simple-array', nullable: true })
  specialties?: string[];

  // Languages spoken
  @Column({ type: 'simple-array', nullable: true })
  languages?: string[];

  // Denormalized metrics — updated by triggers/service
  @Column({ name: 'rating_avg', type: 'decimal', precision: 3, scale: 2, default: 0 })
  ratingAvg: number;

  @Column({ name: 'review_count', default: 0 })
  reviewCount: number;

  @Column({ name: 'booking_count', default: 0 })
  bookingCount: number;

  // Subscription
  @Column({
    name: 'subscription_tier',
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE,
  })
  subscriptionTier: SubscriptionTier;

  // Media
  @Column({ name: 'cover_photo_url', nullable: true })
  coverPhotoUrl?: string;

  @Column({ type: 'simple-json', nullable: true })
  photos?: string[];
}
