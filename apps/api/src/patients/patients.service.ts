import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
      include: {
        medicalProfile: {
          include: { allergies: true, conditions: true, medications: true },
        },
        consents: true,
      },
    });
    if (!profile) throw new NotFoundException('Patient profile not found');
    return profile;
  }

  async update(
    userId: string,
    data: {
      displayName?: string;
      preferredLanguage?: string;
      timezone?: string;
      dateOfBirth?: string | null;
      country?: string;
      region?: string;
      heightCm?: number | null;
      weightKg?: number | null;
      emergencyContactName?: string | null;
      emergencyContactPhone?: string | null;
      consentAiDisclosure?: boolean;
      consentTerms?: boolean;
      consentPrivacy?: boolean;
      allergies?: string[];
      conditions?: string[];
      medications?: string[];
    },
  ) {
    const profile = await this.me(userId);

    await this.prisma.patientProfile.update({
      where: { id: profile.id },
      data: {
        displayName: data.displayName,
        preferredLanguage: data.preferredLanguage,
        timezone: data.timezone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : data.dateOfBirth === null ? null : undefined,
        country: data.country,
        region: data.region,
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        consentAiDisclosure: data.consentAiDisclosure,
        consentTerms: data.consentTerms,
        consentPrivacy: data.consentPrivacy,
      },
    });

    if (data.allergies || data.conditions || data.medications) {
      const mpId = profile.medicalProfile!.id;
      if (data.allergies) {
        await this.prisma.patientAllergy.deleteMany({ where: { medicalProfileId: mpId } });
        if (data.allergies.length) {
          await this.prisma.patientAllergy.createMany({
            data: data.allergies.map((name) => ({ medicalProfileId: mpId, name })),
          });
        }
      }
      if (data.conditions) {
        await this.prisma.medicalCondition.deleteMany({ where: { medicalProfileId: mpId } });
        if (data.conditions.length) {
          await this.prisma.medicalCondition.createMany({
            data: data.conditions.map((name) => ({ medicalProfileId: mpId, name })),
          });
        }
      }
      if (data.medications) {
        await this.prisma.patientMedication.deleteMany({ where: { medicalProfileId: mpId } });
        if (data.medications.length) {
          await this.prisma.patientMedication.createMany({
            data: data.medications.map((name) => ({ medicalProfileId: mpId, name })),
          });
        }
      }
    }

    if (data.consentAiDisclosure || data.consentTerms || data.consentPrivacy) {
      const entries = [
        data.consentAiDisclosure ? { type: 'ai_disclosure', accepted: true } : null,
        data.consentTerms ? { type: 'terms', accepted: true } : null,
        data.consentPrivacy ? { type: 'privacy', accepted: true } : null,
      ].filter(Boolean) as Array<{ type: string; accepted: boolean }>;

      for (const e of entries) {
        await this.prisma.patientConsent.create({
          data: {
            profileId: profile.id,
            type: e.type,
            version: '1.0',
            accepted: e.accepted,
          },
        });
      }
    }

    return this.me(userId);
  }

  async dashboard(userId: string) {
    const [profile, upcoming, recent, notifications, documents] = await Promise.all([
      this.me(userId),
      this.prisma.appointment.findMany({
        where: {
          userId,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      }),
      this.prisma.consultation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { summary: true, prescriptions: true },
      }),
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.medicalDocument.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      profile,
      upcomingAppointments: upcoming,
      recentConsultations: recent,
      notifications,
      documents,
    };
  }
}
