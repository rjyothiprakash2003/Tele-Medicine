import { Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { SessionGuard } from '../session/session.guard';
import { CurrentUser } from '../session/current-user.decorator';
import { SessionUser } from '../session/session.service';

@ApiTags('reports')
@Controller('reports')
@UseGuards(SessionGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  list(@CurrentUser() user: SessionUser) {
    return this.reports.list(user.id);
  }

  @Post('consultation/:consultationId')
  create(
    @CurrentUser() user: SessionUser,
    @Param('consultationId') consultationId: string,
  ) {
    return this.reports.createFromConsultation(user.id, consultationId);
  }

  @Get(':id')
  get(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.reports.get(user.id, id);
  }

  @Post(':id/export')
  async export(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { report, buffer } = await this.reports.exportPdf(user.id, id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report-${report.id}.pdf"`,
    );
    res.send(buffer);
  }
}
