import { Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PrescriptionsService } from './prescriptions.service';
import { SessionGuard } from '../session/session.guard';
import { CurrentUser } from '../session/current-user.decorator';
import { SessionUser } from '../session/session.service';

@ApiTags('prescriptions')
@Controller('prescriptions')
@UseGuards(SessionGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsService) {}

  @Get('consultation/:consultationId')
  list(
    @CurrentUser() user: SessionUser,
    @Param('consultationId') consultationId: string,
  ) {
    return this.prescriptions.listForConsultation(user.id, consultationId);
  }

  @Post('consultation/:consultationId/generate')
  generate(
    @CurrentUser() user: SessionUser,
    @Param('consultationId') consultationId: string,
  ) {
    return this.prescriptions.generateFromConsultation(user.id, consultationId);
  }

  @Get(':id/download')
  async download(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { rx, buffer } = await this.prescriptions.download(user.id, id);
    res.setHeader('Content-Type', rx.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ai-rx-record-${rx.id}.png"`,
    );
    res.send(buffer);
  }
}
