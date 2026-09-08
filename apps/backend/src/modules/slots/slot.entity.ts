// slot.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Clinic } from '../clinics/clinic.entity';

export enum SlotStatus {
  AVAILABLE = 'available',
  LOCKED = 'locked',
  BOOKED = 'booked',
  BLOCKED = 'blocked',
}

@Entity('slots')
@Index(['doctorId', 'startTime'])
@Index(['clinicId', 'startTime'])
export class Slot extends BaseEntity {
  @Column({ name: 'clinic_id' })
  clinicId: string;

  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ name: 'doctor_id', nullable: true })
  doctorId?: string;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({ type: 'enum', enum: SlotStatus, default: SlotStatus.AVAILABLE })
  status: SlotStatus;

  @Column({ name: 'locked_until', nullable: true, type: 'timestamptz' })
  lockedUntil?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fee?: number;

  @Column({ nullable: true })
  notes?: string;
}
