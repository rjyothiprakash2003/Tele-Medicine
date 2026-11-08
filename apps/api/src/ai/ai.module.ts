import { Global, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { SafetyModule } from '../safety/safety.module';

@Global()
@Module({
  imports: [SafetyModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
