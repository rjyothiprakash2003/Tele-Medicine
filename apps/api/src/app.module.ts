import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { SessionModule } from './session/session.module';
import { PatientsModule } from './patients/patients.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { SafetyModule } from './safety/safety.module';
import { AiModule } from './ai/ai.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { DocumentsModule } from './documents/documents.module';
import { ReportsModule } from './reports/reports.module';
import { MedicationsModule } from './medications/medications.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { AvatarModule } from './avatar/avatar.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StorageModule,
    SessionModule,
    PatientsModule,
    SafetyModule,
    AiModule,
    KnowledgeModule,
    ConsultationsModule,
    AvatarModule,
    AppointmentsModule,
    DocumentsModule,
    PrescriptionsModule,
    ReportsModule,
    MedicationsModule,
    NotificationsModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
