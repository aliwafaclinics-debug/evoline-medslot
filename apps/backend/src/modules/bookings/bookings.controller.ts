import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, CancelBookingDto, LockSlotDto } from './dto/booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/index';
import { Roles, CurrentUser, UserRole } from '../../common/decorators';
import { User } from '../auth/user.entity';

@ApiTags('bookings')
@Controller({ path: 'bookings', version: '1' })
@UseGuards(JwtAuthGuard) // All booking endpoints require auth
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Book an appointment (patient only)' })
  async create(@Body() dto: CreateBookingDto, @CurrentUser() user: User) {
    return this.bookingsService.create(dto, user);
  }

  @Post('lock-slot')
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Temporarily lock a slot during booking flow (10 min)' })
  async lockSlot(@Body() dto: LockSlotDto, @CurrentUser() user: User) {
    return this.bookingsService.lockSlot(dto.slotId, user.id);
  }

  @Get('my')
  @ApiOperation({ summary: "Get current patient's appointments" })
  async getMyAppointments(@CurrentUser() user: User) {
    return this.bookingsService.findPatientAppointments(user.id);
  }

  @Get('clinic/:clinicId')
  @Roles(UserRole.CLINIC_OWNER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Get all appointments for a clinic (owner or admin)" })
  async getClinicAppointments(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.findClinicAppointments(clinicId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single appointment by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.findOne(id, user);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an appointment' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.cancel(id, dto, user);
  }
}
