import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PatientsService } from './patients.service';
import { SessionGuard } from '../session/session.guard';
import { CurrentUser } from '../session/current-user.decorator';
import { SessionUser } from '../session/session.service';

class UpdatePatientDto {
  @IsOptional() @IsString() @MaxLength(120) displayName?: string;
  @IsOptional() @IsString() @MaxLength(16) preferredLanguage?: string;
  @IsOptional() @IsString() @MaxLength(64) timezone?: string;
  @IsOptional() @IsString() dateOfBirth?: string | null;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsNumber() heightCm?: number | null;
  @IsOptional() @IsNumber() weightKg?: number | null;
  @IsOptional() @IsString() emergencyContactName?: string | null;
  @IsOptional() @IsString() emergencyContactPhone?: string | null;
  @IsOptional() @IsBoolean() consentAiDisclosure?: boolean;
  @IsOptional() @IsBoolean() consentTerms?: boolean;
  @IsOptional() @IsBoolean() consentPrivacy?: boolean;
  @IsOptional() @IsArray() allergies?: string[];
  @IsOptional() @IsArray() conditions?: string[];
  @IsOptional() @IsArray() medications?: string[];
}

@ApiTags('patients')
@Controller('patients')
@UseGuards(SessionGuard)
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get('me')
  me(@CurrentUser() user: SessionUser) {
    return this.patients.me(user.id);
  }

  @Patch('me')
  update(@CurrentUser() user: SessionUser, @Body() body: UpdatePatientDto) {
    return this.patients.update(user.id, body);
  }

  @Get('me/dashboard')
  dashboard(@CurrentUser() user: SessionUser) {
    return this.patients.dashboard(user.id);
  }
}
