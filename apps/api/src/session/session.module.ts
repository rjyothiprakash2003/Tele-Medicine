import { Global, Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionGuard } from './session.guard';
import { AdminGuard } from './admin.guard';

@Global()
@Module({
  providers: [SessionService, SessionGuard, AdminGuard],
  exports: [SessionService, SessionGuard, AdminGuard],
})
export class SessionModule {}
