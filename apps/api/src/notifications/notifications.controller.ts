import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SessionGuard } from '../session/session.guard';
import { CurrentUser } from '../session/current-user.decorator';
import { SessionUser } from '../session/session.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(SessionGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: SessionUser) {
    return this.notifications.list(user.id);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.notifications.markRead(user.id, id);
  }
}
