// inquiry.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../auth/user.entity';

export enum InquiryStatus {
  NEW = 'new',
  VIEWED = 'viewed',
  IN_DISCUSSION = 'in_discussion',
  NDA_SIGNED = 'nda_signed',
  OFFER_MADE = 'offer_made',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

@Entity('inquiries')
@Index(['listingId'])
@Index(['investorId'])
@Index(['status'])
export class Inquiry extends BaseEntity {
  @Column({ name: 'listing_id' })
  listingId: string;

  @Column({ name: 'investor_id' })
  investorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'investor_id' })
  investor: User;

  @Column({ type: 'enum', enum: InquiryStatus, default: InquiryStatus.NEW })
  status: InquiryStatus;

  @Column({ name: 'budget_min', type: 'decimal', precision: 15, scale: 2, nullable: true })
  budgetMin?: number;

  @Column({ name: 'budget_max', type: 'decimal', precision: 15, scale: 2, nullable: true })
  budgetMax?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  stakeInterestPct?: number;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true })
  timeline?: string;

  @Column({ name: 'nda_signed_at', nullable: true, type: 'timestamptz' })
  ndaSignedAt?: Date;

  @Column({ name: 'first_viewed_at', nullable: true, type: 'timestamptz' })
  firstViewedAt?: Date;

  @Column({ name: 'last_activity_at', type: 'timestamptz', default: () => 'NOW()' })
  lastActivityAt: Date;

  @Column({ name: 'seller_notes', nullable: true, type: 'text' })
  sellerNotes?: string;
}
