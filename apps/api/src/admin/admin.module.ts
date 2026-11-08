import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AiModule } from '../ai/ai.module';
import { AvatarModule } from '../avatar/avatar.module';

@Module({
  imports: [AiModule, AvatarModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
