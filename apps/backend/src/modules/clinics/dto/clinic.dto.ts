import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsEmail,
  IsUrl,
  MaxLength,
  IsInt,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Emirate, ClinicStatus } from '../clinic.entity';

export class SearchClinicsDto {
  @ApiPropertyOptional({ description: 'Full-text search on clinic name' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: Emirate })
  @IsOptional()
  @IsEnum(Emirate)
  emirate?: Emirate;

  @ApiPropertyOptional({ description: 'Comma-separated list e.g. dentistry,cardiology' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  specialties?: string[];

  @ApiPropertyOptional({ description: 'Min rating (1-5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Max consultation fee in AED' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxFee?: number;

  @ApiPropertyOptional({ description: 'Language code e.g. ar, en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Only return verified clinics' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  verifiedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Sort by', enum: ['rating', 'price', 'distance', 'newest'] })
  @IsOptional()
  @IsString()
  sortBy?: 'rating' | 'price' | 'distance' | 'newest';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CreateClinicDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: Emirate })
  @IsEnum(Emirate)
  emirate: Emirate;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dhaLicenseNo?: string;
}

export class UpdateClinicDto extends CreateClinicDto {}
