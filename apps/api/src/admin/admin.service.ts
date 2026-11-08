import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AvatarService } from '../avatar/avatar.service';
import { asJson } from '../common/json';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly avatar: AvatarService,
  ) {}

  async metrics() {
    const [
      users,
      appointments,
      consultations,
      completed,
      emergencies,
      notifications,
      documents,
      safetyEvents,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.appointment.groupBy({ by: ['status'], _count: true }),
      this.prisma.consultation.count(),
      this.prisma.consultation.count({ where: { status: 'COMPLETED' } }),
      this.prisma.consultation.count({ where: { status: 'EMERGENCY_STOPPED' } }),
      this.prisma.notification.count(),
      this.prisma.medicalDocument.count({ where: { deletedAt: null } }),
      this.prisma.safetyEvent.groupBy({ by: ['severity'], _count: true }),
    ]);

    return {
      totalRegisteredUsers: users,
      appointmentStats: appointments,
      consultationsTotal: consultations,
      consultationsCompleted: completed,
      emergencyStops: emergencies,
      notifications,
      storageDocuments: documents,
      safetyEventCounts: safetyEvents,
      aiProvider: { name: this.ai.getProviderName(), mock: this.ai.isMock(), healthy: true },
      avatarProvider: { name: this.avatar.getProviderName(), healthy: true },
      doctorRoleExists: false,
      rolesDefined: ['PATIENT', 'ADMINISTRATOR', 'SYSTEM_SERVICE'],
    };
  }

  async audit(action: string, resource: string, details?: Record<string, unknown>) {
    return this.prisma.adminAuditLog.create({
      data: { action, resource, details: asJson(details ?? {}) },
    });
  }

  recentSafety(limit = 50) {
    return this.prisma.safetyEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        severity: true,
        ruleId: true,
        message: true,
        createdAt: true,
        consultationId: true,
      },
    });
  }
}
