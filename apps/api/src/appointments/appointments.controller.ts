import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AppointmentStatus, AvatarGender, ConsultationMode } from '@prisma/client';
import { AppointmentsService } from './appointments.service';
import { SessionGuard } from '../session/session.guard';
import { CurrentUser } from '../session/current-user.decorator';
import { SessionUser } from '../session/session.service';

class CreateAppointmentDto {
  @IsEnum(ConsultationMode)
  mode!: ConsultationMode;

  @IsString()
  scheduledAt!: string;

  @IsOptional() @IsInt() @Min(10) @Max(60)
  durationMinutes?: number;

  @IsOptional() @IsEnum(AvatarGender)
  avatarGender?: AvatarGender;

  @IsOptional() @IsString() @MaxLength(16)
  language?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  reason?: string;

  @IsOptional() @IsString()
  timezone?: string;
}

class UpdateAppointmentDto {
  @IsOptional() @IsString() scheduledAt?: string;
  @IsOptional() @IsEnum(AppointmentStatus) status?: AppointmentStatus;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsEnum(AvatarGender) avatarGender?: AvatarGender;
  @IsOptional() @IsString() language?: string;
}

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(SessionGuard)
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  list(@CurrentUser() user: SessionUser) {
    return this.appointments.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: SessionUser, @Body() body: CreateAppointmentDto) {
    return this.appointments.create(user.id, body);
  }

  @Get(':id')
  get(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.appointments.get(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Body() body: UpdateAppointmentDto,
  ) {
    return this.appointments.update(user.id, id, body);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.appointments.cancel(user.id, id);
  }
}
