import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, ConsultationMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { asJson } from '../common/json';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.appointment.findMany({
      where: { userId },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async get(userId: string, id: string) {
    const a = await this.prisma.appointment.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Appointment not found');
    if (a.userId !== userId) throw new ForbiddenException('Access denied');
    return a;
  }

  async create(
    userId: string,
    input: {
      mode: ConsultationMode;
      scheduledAt: string;
      durationMinutes?: number;
      avatarGender?: 'MALE' | 'FEMALE';
      language?: string;
      reason?: string;
      timezone?: string;
    },
  ) {
    if (input.mode === 'ASSESSMENT') {
      throw new BadRequestException('Assessment mode is not bookable as an appointment');
    }
    const scheduledAt = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now() - 60_000) {
      throw new BadRequestException('scheduledAt must be a valid future time');
    }
    const duration = input.durationMinutes ?? 20;
    const end = new Date(scheduledAt.getTime() + duration * 60_000);

    const conflict = await this.prisma.appointment.findFirst({
      where: {
        userId,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
        scheduledAt: {
          lt: end,
          gte: new Date(scheduledAt.getTime() - duration * 60_000),
        },
      },
    });
    if (conflict) {
      throw new ConflictException('Conflicting AI session already booked in this window');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        userId,
        mode: input.mode,
        status: 'CONFIRMED',
        scheduledAt,
        durationMinutes: duration,
        avatarGender: input.avatarGender,
        language: input.language ?? 'en',
        reason: input.reason,
        timezone: input.timezone ?? 'Asia/Kolkata',
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'AI session scheduled',
        body: `Your AI ${input.mode.toLowerCase()} session is confirmed.`,
        type: 'appointment_confirmed',
        metadata: asJson({ appointmentId: appointment.id }),
      },
    });

    return appointment;
  }

  async update(
    userId: string,
    id: string,
    input: {
      scheduledAt?: string;
      status?: AppointmentStatus;
      reason?: string;
      avatarGender?: 'MALE' | 'FEMALE';
      language?: string;
    },
  ) {
    await this.get(userId, id);
    const data: Record<string, unknown> = {};
    if (input.scheduledAt) {
      data.scheduledAt = new Date(input.scheduledAt);
      data.status = 'RESCHEDULED';
    }
    if (input.status) data.status = input.status;
    if (input.reason !== undefined) data.reason = input.reason;
    if (input.avatarGender) data.avatarGender = input.avatarGender;
    if (input.language) data.language = input.language;

    const updated = await this.prisma.appointment.update({ where: { id }, data });
    if (input.scheduledAt) {
      await this.prisma.notification.create({
        data: {
          userId,
          title: 'Session rescheduled',
          body: 'Your AI consultation appointment was rescheduled.',
          type: 'appointment_rescheduled',
          metadata: asJson({ appointmentId: id }),
        },
      });
    }
    return updated;
  }

  async cancel(userId: string, id: string) {
    await this.get(userId, id);
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Session cancelled',
        body: 'Your AI consultation appointment was cancelled.',
        type: 'appointment_cancelled',
        metadata: asJson({ appointmentId: id }),
      },
    });
    return updated;
  }
}
