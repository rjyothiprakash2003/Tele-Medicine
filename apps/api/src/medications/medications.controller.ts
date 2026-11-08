import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { MedicationsService } from './medications.service';
import { SessionGuard } from '../session/session.guard';

class LookupQuery {
  @IsString()
  @MinLength(1)
  q!: string;
}

@ApiTags('medications')
@Controller('medications')
@UseGuards(SessionGuard)
export class MedicationsController {
  constructor(private readonly medications: MedicationsService) {}

  @Get('lookup')
  lookup(@Query() query: LookupQuery) {
    return this.medications.lookup(query.q);
  }
}
