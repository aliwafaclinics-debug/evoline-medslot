import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { Slot, SlotStatus } from '../slots/slot.entity';
import { CreateBookingDto, CancelBookingDto } from './dto/booking.dto';
import { User } from '../auth/user.entity';
import { UserRole } from '../../common/decorators';
import { NotificationsService } from '../notifications/notifications.service';

const SLOT_LOCK_MINUTES = 10;

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Slot)
    private readonly slotRepo: Repository<Slot>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── CREATE BOOKING ────────────────────────────────────────────────────────
  /**
   * Creates a booking atomically:
   * 1. Lock the slot in a DB transaction (prevents race conditions)
   * 2. Create the appointment record
   * 3. Mark slot as BOOKED
   * 4. Send confirmation notifications (async)
   */
  async create(dto: CreateBookingDto, patient: User): Promise<Appointment> {
    return this.dataSource.transaction(async (manager) => {
      // Step 1: Fetch and lock the slot row (SELECT FOR UPDATE)
      const slot = await manager
        .getRepository(Slot)
        .createQueryBuilder('slot')
        .setLock('pessimistic_write')
        .where('slot.id = :id', { id: dto.slotId })
        .getOne();

      if (!slot) {
        throw new NotFoundException('Slot not found');
      }

      // Step 2: Validate slot availability
      if (slot.status === SlotStatus.BOOKED) {
        throw new ConflictException('This slot has already been booked');
      }

      if (slot.status === SlotStatus.BLOCKED) {
        throw new BadRequestException('This slot is not available for booking');
      }

      // Check if a temporary lock is still valid
      if (
        slot.status === SlotStatus.LOCKED &&
        slot.lockedUntil &&
        slot.lockedUntil > new Date()
      ) {
        throw new ConflictException(
          'This slot is temporarily reserved. Please try again in a few minutes.',
        );
      }

      if (slot.startTime < new Date()) {
        throw new BadRequestException('Cannot book a slot in the past');
      }

      // Step 3: Create appointment
      const appointment = manager.getRepository(Appointment).create({
        patientId: patient.id,
        clinicId: slot.clinicId,
        doctorId: dto.doctorId || slot.doctorId,
        slotId: slot.id,
        appointmentDate: slot.startTime,
        reason: dto.reason,
        patientNotes: dto.patientNotes,
        isFirstVisit: dto.isFirstVisit ?? false,
        feeCharged: slot.fee,
        status: AppointmentStatus.CONFIRMED,
        confirmedAt: new Date(),
      });

      const saved = await manager.getRepository(Appointment).save(appointment);

      // Step 4: Mark slot as BOOKED
      await manager.getRepository(Slot).update(slot.id, {
        status: SlotStatus.BOOKED,
        lockedUntil: undefined,
      });

      // Step 5: Increment clinic booking count
      await manager.query(
        `UPDATE clinics SET booking_count = booking_count + 1 WHERE id = $1`,
        [slot.clinicId],
      );

      // Step 6: Fire notifications (outside transaction — non-blocking)
      setImmediate(() => {
        this.notificationsService.sendBookingConfirmation(saved.id).catch(
          (err) => console.error('Notification failed:', err),
        );
      });

      return saved;
    });
  }

  // ─── LOCK SLOT (pre-booking reservation) ──────────────────────────────────
  /**
   * Temporarily locks a slot during the booking flow (10-min TTL).
   * Prevents another user from booking the same slot simultaneously.
   */
  async lockSlot(slotId: string, userId: string): Promise<{ lockedUntil: Date }> {
    return this.dataSource.transaction(async (manager) => {
      const slot = await manager
        .getRepository(Slot)
        .createQueryBuilder('slot')
        .setLock('pessimistic_write')
        .where('slot.id = :id', { id: slotId })
        .getOne();

      if (!slot) throw new NotFoundException('Slot not found');

      if (slot.status === SlotStatus.BOOKED) {
        throw new ConflictException('Slot already booked');
      }

      if (
        slot.status === SlotStatus.LOCKED &&
        slot.lockedUntil &&
        slot.lockedUntil > new Date()
      ) {
        throw new ConflictException('Slot is temporarily reserved by another user');
      }

      const lockedUntil = new Date(Date.now() + SLOT_LOCK_MINUTES * 60 * 1000);

      await manager.getRepository(Slot).update(slotId, {
        status: SlotStatus.LOCKED,
        lockedUntil,
      });

      return { lockedUntil };
    });
  }

  // ─── GET APPOINTMENTS ──────────────────────────────────────────────────────

  async findPatientAppointments(patientId: string): Promise<Appointment[]> {
    return this.appointmentRepo.find({
      where: { patientId },
      relations: ['clinic', 'slot'],
      order: { appointmentDate: 'DESC' },
    });
  }

  async findClinicAppointments(
    clinicId: string,
    user: User,
  ): Promise<Appointment[]> {
    if (user.role !== UserRole.ADMIN) {
      // Verify user owns this clinic
      const isOwner = await this.appointmentRepo
        .createQueryBuilder('a')
        .innerJoin('clinics', 'c', 'c.id = a.clinic_id AND c.owner_id = :userId', {
          userId: user.id,
        })
        .where('a.clinic_id = :clinicId', { clinicId })
        .getCount();

      if (!isOwner) throw new ForbiddenException('Not your clinic');
    }

    return this.appointmentRepo.find({
      where: { clinicId },
      relations: ['patient', 'slot'],
      order: { appointmentDate: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<Appointment> {
    const appt = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['patient', 'clinic', 'slot'],
    });

    if (!appt) throw new NotFoundException('Appointment not found');

    if (
      user.role !== UserRole.ADMIN &&
      appt.patientId !== user.id &&
      appt.clinic.ownerId !== user.id
    ) {
      throw new ForbiddenException('Access denied');
    }

    return appt;
  }

  // ─── CANCEL ────────────────────────────────────────────────────────────────

  async cancel(id: string, dto: CancelBookingDto, user: User): Promise<Appointment> {
    const appt = await this.findOne(id, user);

    if ([AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW].includes(appt.status)) {
      throw new BadRequestException(`Cannot cancel an appointment with status: ${appt.status}`);
    }

    // Check 24h cancellation policy
    const hoursUntilAppt =
      (appt.appointmentDate.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilAppt < 2 && user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Cannot cancel within 2 hours of appointment');
    }

    appt.status = AppointmentStatus.CANCELLED;
    appt.cancelledAt = new Date();
    appt.cancelledBy = user.id;
    appt.cancelReason = dto.reason;

    // Release the slot
    await this.slotRepo.update(appt.slotId, { status: SlotStatus.AVAILABLE });

    const saved = await this.appointmentRepo.save(appt);

    // Notify patient and clinic
    setImmediate(() => {
      this.notificationsService.sendBookingCancellation(saved.id).catch(console.error);
    });

    return saved;
  }

  // ─── CLEANUP ───────────────────────────────────────────────────────────────

  /** Run periodically to release expired locks */
  async releaseExpiredLocks(): Promise<void> {
    await this.slotRepo
      .createQueryBuilder()
      .update(Slot)
      .set({ status: SlotStatus.AVAILABLE, lockedUntil: undefined })
      .where('status = :status', { status: SlotStatus.LOCKED })
      .andWhere('locked_until < :now', { now: new Date() })
      .execute();
  }
}
