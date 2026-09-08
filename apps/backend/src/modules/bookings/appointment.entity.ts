import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../auth/user.entity';
import { Clinic } from '../clinics/clinic.entity';
import { Slot } from '../slots/slot.entity';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('appointments')
@Index(['patientId'])
@Index(['clinicId', 'appointmentDate'])
@Index(['status'])
export class Appointment extends BaseEntity {
  // Patient
  @Column({ name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patient_id' })
  patient: User;

  // Clinic (denormalized for query speed)
  @Column({ name: 'clinic_id' })
  clinicId: string;

  @ManyToOne(() => Clinic, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  // Doctor ID (optional — may not be assigned at booking)
  @Column({ name: 'doctor_id', nullable: true })
  doctorId?: string;

  // Slot — unique per appointment (prevents double-booking)
  @Column({ name: 'slot_id', unique: true })
  slotId: string;

  @ManyToOne(() => Slot, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'slot_id' })
  slot: Slot;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ name: 'appointment_date', type: 'timestamptz' })
  appointmentDate: Date;

  // Patient intake
  @Column({ nullable: true })
  reason?: string;

  @Column({ name: 'patient_notes', type: 'text', nullable: true })
  patientNotes?: string;

  @Column({ name: 'is_first_visit', default: false })
  isFirstVisit: boolean;

  // Financial — snapshot at booking time
  @Column({ name: 'fee_charged', type: 'decimal', precision: 10, scale: 2, nullable: true })
  feeCharged?: number;

  @Column({ name: 'fee_paid', default: false })
  feePaid: boolean;

  // Reminder tracking
  @Column({ name: 'reminder_24h_sent', default: false })
  reminder24hSent: boolean;

  @Column({ name: 'reminder_2h_sent', default: false })
  reminder2hSent: boolean;

  // Cancellation
  @Column({ name: 'cancelled_at', nullable: true, type: 'timestamptz' })
  cancelledAt?: Date;

  @Column({ name: 'cancel_reason', nullable: true })
  cancelReason?: string;

  @Column({ name: 'cancelled_by', nullable: true })
  cancelledBy?: string;

  @Column({ name: 'confirmed_at', nullable: true, type: 'timestamptz' })
  confirmedAt?: Date;

  @Column({ name: 'completed_at', nullable: true, type: 'timestamptz' })
  completedAt?: Date;
}
