import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../bookings/appointment.entity';

export enum NotificationType {
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_REMINDER = 'booking_reminder',
  INQUIRY_RECEIVED = 'inquiry_received',
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly configService: ConfigService,
  ) {}

  // ─── BOOKING EVENTS ────────────────────────────────────────────────────────

  async sendBookingConfirmation(appointmentId: string): Promise<void> {
    const appt = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'clinic', 'slot'],
    });

    if (!appt) return;

    const message = this.buildConfirmationMessage(appt);

    await Promise.allSettled([
      this.sendWhatsApp(appt.patient.phone, message),
      this.sendEmail(appt.patient.email, 'Booking Confirmed — Evoline MedSlot', message),
    ]);
  }

  async sendBookingCancellation(appointmentId: string): Promise<void> {
    const appt = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'clinic'],
    });

    if (!appt) return;

    const message = `
❌ Appointment Cancelled

Your appointment at ${appt.clinic.name} has been cancelled.

If you didn't request this, please contact us at support@evolinemedslot.ae

Book a new appointment: https://evolinemedslot.ae/clinics
    `.trim();

    await Promise.allSettled([
      this.sendWhatsApp(appt.patient.phone, message),
      this.sendEmail(appt.patient.email, 'Appointment Cancelled — Evoline MedSlot', message),
    ]);
  }

  async sendBookingReminder(appointmentId: string, hoursUntil: number): Promise<void> {
    const appt = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'clinic', 'slot'],
    });

    if (!appt) return;

    const message = `
⏰ Reminder: Appointment in ${hoursUntil} hours

📍 ${appt.clinic.name}
📅 ${this.formatDate(appt.appointmentDate)}
🕐 ${this.formatTime(appt.appointmentDate)}

Please arrive 10 minutes early.

To cancel: https://evolinemedslot.ae/bookings/${appt.id}/cancel
    `.trim();

    await this.sendWhatsApp(appt.patient.phone, message);
  }

  // ─── CHANNELS ──────────────────────────────────────────────────────────────

  private async sendWhatsApp(phone: string | undefined, message: string): Promise<void> {
    if (!phone) return;

    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');

    if (!accountSid || accountSid === 'your_sid') {
      this.logger.log(`[WhatsApp MOCK] To: ${phone}\n${message}`);
      return;
    }

    try {
      // Dynamic import to avoid crash when Twilio not configured
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);

      await client.messages.create({
        from: this.configService.get('TWILIO_WHATSAPP_FROM'),
        to: `whatsapp:${phone}`,
        body: message,
      });

      this.logger.log(`WhatsApp sent to ${phone}`);
    } catch (error) {
      this.logger.error(`WhatsApp failed to ${phone}:`, error.message);
      throw error;
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    text: string,
  ): Promise<void> {
    const apiKey = this.configService.get('SENDGRID_API_KEY');

    if (!apiKey || apiKey === 'your_key') {
      this.logger.log(`[Email MOCK] To: ${to} | Subject: ${subject}`);
      return;
    }

    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(apiKey);

      await sgMail.send({
        to,
        from: this.configService.get('SENDGRID_FROM_EMAIL', 'noreply@evolinemedslot.ae'),
        subject,
        text,
        html: this.textToHtml(text),
      });

      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Email failed to ${to}:`, error.message);
      throw error;
    }
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private buildConfirmationMessage(appt: Appointment): string {
    return `
✅ Booking Confirmed!

🏥 ${appt.clinic.name}
📅 ${this.formatDate(appt.appointmentDate)}
🕐 ${this.formatTime(appt.appointmentDate)}
💰 AED ${appt.feeCharged || 0} (pay at clinic)

Your booking reference: ${appt.id.slice(0, 8).toUpperCase()}

View your booking: https://evolinemedslot.ae/bookings/${appt.id}

Please arrive 10 minutes early. Free cancellation up to 24 hours before.
    `.trim();
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-AE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-AE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Dubai',
    });
  }

  private textToHtml(text: string): string {
    return `<pre style="font-family:sans-serif;font-size:14px;line-height:1.6">${text}</pre>`;
  }
}
