import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../session/admin.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiHeader({ name: 'x-admin-key', required: true })
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('metrics')
  async metrics() {
    await this.admin.audit('view_metrics', 'admin_dashboard');
    return this.admin.metrics();
  }

  @Get('safety-events')
  safety() {
    return this.admin.recentSafety();
  }
}
