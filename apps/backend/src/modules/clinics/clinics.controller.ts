import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';
import { SearchClinicsDto, CreateClinicDto, UpdateClinicDto } from './dto/clinic.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/index';
import { Roles, CurrentUser, UserRole } from '../../common/decorators';
import { User } from '../auth/user.entity';

@ApiTags('clinics')
@Controller({ path: 'clinics', version: '1' })
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  // ─── PUBLIC ENDPOINTS ─────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Search and filter active clinic listings' })
  async search(@Query() dto: SearchClinicsDto) {
    return this.clinicsService.search(dto);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get clinic by URL slug' })
  @ApiParam({ name: 'slug', example: 'bright-smile-dental' })
  async findBySlug(@Param('slug') slug: string) {
    return this.clinicsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get clinic by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicsService.findOne(id);
  }

  // ─── AUTHENTICATED ENDPOINTS ──────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLINIC_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new clinic listing (clinic_owner only)' })
  async create(@Body() dto: CreateClinicDto, @CurrentUser() user: User) {
    return this.clinicsService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLINIC_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update clinic details (owner or admin)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClinicDto,
    @CurrentUser() user: User,
  ) {
    return this.clinicsService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLINIC_OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete clinic (owner or admin)' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.clinicsService.delete(id, user);
  }

  @Get('my/clinic')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLINIC_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated owner's clinic" })
  async getMyClinic(@CurrentUser() user: User) {
    return this.clinicsService.getMyClinic(user.id);
  }

  // ─── ADMIN ENDPOINTS ──────────────────────────────────────────────────────

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: verify and activate a clinic listing' })
  async verify(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.clinicsService.verify(id, user);
  }
}
