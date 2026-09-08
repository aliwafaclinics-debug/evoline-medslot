import {
  IsUUID,
  IsOptional,
  IsString,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'UUID of the slot to book' })
  @IsUUID()
  slotId: string;

  @ApiPropertyOptional({ description: 'UUID of preferred doctor (optional)' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ example: 'Routine dental checkup' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  patientNotes?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFirstVisit?: boolean;
}

export class CancelBookingDto {
  @ApiPropertyOptional({ example: 'Schedule conflict' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class LockSlotDto {
  @ApiProperty()
  @IsUUID()
  slotId: string;
}
