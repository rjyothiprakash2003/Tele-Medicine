import { Module } from '@nestjs/common';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { TokenService } from './token.service';
import { SafetyModule } from '../safety/safety.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';

@Module({
  imports: [SafetyModule, KnowledgeModule],
  controllers: [ConsultationsController],
  providers: [ConsultationsService, TokenService],
  exports: [ConsultationsService, TokenService],
})
export class ConsultationsModule {}
