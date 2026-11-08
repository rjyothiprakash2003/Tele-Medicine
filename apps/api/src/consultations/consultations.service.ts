import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConsultationMode, MessageRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { SafetyService } from '../safety/safety.service';
import { TokenService } from './token.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { asJson } from '../common/json';

@Injectable()
export class ConsultationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly ai: AiService,
    private readonly safety: SafetyService,
    private readonly knowledge: KnowledgeService,
  ) {}

  async start(
    userId: string,
    input: {
      mode: ConsultationMode;
      avatarGender?: 'MALE' | 'FEMALE';
      language?: string;
      reason?: string;
      useMedicalProfile?: boolean;
      appointmentId?: string;
    },
  ) {
    const tokenNumber = await this.tokens.nextToken();
    const consultation = await this.prisma.consultation.create({
      data: {
        userId,
        appointmentId: input.appointmentId,
        tokenNumber,
        mode: input.mode,
        avatarGender: input.avatarGender,
        language: input.language ?? 'en',
        reason: input.reason,
        useMedicalProfile: input.useMedicalProfile ?? false,
        consentState: asJson({ aiDisclosure: true }),
        conversationState: 'READY',
        messages: {
          create: {
            role: 'SYSTEM',
            content:
              'Consultation started with TELEMEDICINE AI. The assistant is AI-generated and is not a licensed physician.',
          },
        },
      },
      include: { messages: true },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Consultation started',
        body: `Token ${tokenNumber} is active. Mode: ${input.mode}.`,
        type: 'consultation_started',
        metadata: asJson({ consultationId: consultation.id, tokenNumber }),
      },
    });

    return consultation;
  }

  async list(userId: string) {
    return this.prisma.consultation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        summary: true,
        prescriptions: true,
        reports: true,
      },
    });
  }

  async get(userId: string, id: string) {
    const c = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        summary: true,
        transcript: true,
        assessment: { include: { sources: { include: { source: true } } } },
        documents: true,
        prescriptions: true,
        reports: true,
        treatments: true,
      },
    });
    if (!c) throw new NotFoundException('Consultation not found');
    if (c.userId !== userId) throw new ForbiddenException('Access denied');
    return c;
  }

  async getByToken(userId: string, tokenNumber: string) {
    const c = await this.prisma.consultation.findUnique({ where: { tokenNumber } });
    if (!c) throw new NotFoundException('Token not found');
    if (c.userId !== userId) throw new ForbiddenException('Access denied');
    return this.get(userId, c.id);
  }

  async sendMessage(userId: string, consultationId: string, content: string, requestId?: string) {
    const consultation = await this.get(userId, consultationId);
    if (consultation.status !== 'ACTIVE') {
      throw new BadRequestException('Consultation is not active');
    }

    const emergency = this.safety.evaluateUserText(content);
    await this.prisma.consultationMessage.create({
      data: {
        consultationId,
        role: 'USER',
        content,
        requestId: requestId ?? randomUUID(),
      },
    });

    if (emergency.isEmergency) {
      await this.safety.logEvent({
        userId,
        consultationId,
        severity: 'EMERGENCY',
        ruleId: emergency.ruleIds[0] ?? 'emergency',
        message: emergency.message,
      });

      const safetyMsg =
        emergency.emergencyGuidance?.guidance ??
        'Possible emergency. Seek emergency care immediately.';

      await this.prisma.consultationMessage.create({
        data: {
          consultationId,
          role: 'SAFETY',
          content: safetyMsg,
          metadata: asJson({ emergency: true, ruleIds: emergency.ruleIds }),
        },
      });

      await this.prisma.consultation.update({
        where: { id: consultationId },
        data: {
          status: 'EMERGENCY_STOPPED',
          safetyOutcome: 'EMERGENCY',
          conversationState: 'EMERGENCY',
          endedAt: new Date(),
        },
      });

      return {
        emergency: true,
        guidance: emergency.emergencyGuidance,
        message: safetyMsg,
      };
    }

    const history = await this.prisma.consultationMessage.findMany({
      where: { consultationId, role: { in: ['USER', 'ASSISTANT'] } },
      orderBy: { createdAt: 'asc' },
      take: 40,
    });

    const mode =
      consultation.mode === 'ASSESSMENT'
        ? 'assessment'
        : ('chat' as const);

    const citations = await this.knowledge.retrieve(content);

    const ai = await this.ai.generateSafe({
      mode,
      requestId,
      language: consultation.language,
      messages: history.map((m) => ({
        role: m.role === 'ASSISTANT' ? 'assistant' : 'user',
        content: m.content,
      })),
    });

    let assistantContent = ai.content;
    if (citations.length > 0) {
      assistantContent +=
        '\n\n**Evidence references (public sources):**\n' +
        citations
          .map(
            (c) =>
              `- ${c.title} — ${c.publisher} (${c.url})`,
          )
          .join('\n');
    }

    const saved = await this.prisma.consultationMessage.create({
      data: {
        consultationId,
        role: 'ASSISTANT' as MessageRole,
        content: assistantContent,
        requestId,
        metadata: asJson({ provider: ai.provider, mock: ai.mock, citations }),
      },
    });

    await this.prisma.consultation.update({
      where: { id: consultationId },
      data: { conversationState: 'READY' },
    });

    return { emergency: false, message: saved, mock: ai.mock };
  }

  async end(userId: string, consultationId: string) {
    const consultation = await this.get(userId, consultationId);
    if (consultation.status === 'COMPLETED') return consultation;

    const messages = consultation.messages
      .filter((m) => m.role === 'USER' || m.role === 'ASSISTANT')
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const summaryAi = await this.ai.generateSafe({
      mode: 'summary',
      messages: [{ role: 'user', content: messages || consultation.reason || 'No messages' }],
    });

    const disclaimer =
      'AI-generated summary for informational purposes only. Not a medical diagnosis. Not a legally valid prescription.';

    await this.prisma.consultationSummary.upsert({
      where: { consultationId },
      create: {
        consultationId,
        mainConcern: consultation.reason,
        summaryText: summaryAi.content,
        structured: asJson({ generatedBy: summaryAi.provider, mock: summaryAi.mock }),
        disclaimer,
      },
      update: {
        summaryText: summaryAi.content,
        structured: asJson({ generatedBy: summaryAi.provider, mock: summaryAi.mock }),
      },
    });

    await this.prisma.consultationTranscript.upsert({
      where: { consultationId },
      create: { consultationId, content: messages },
      update: { content: messages },
    });

    const thankYou =
      `Thank you for consulting TELEMEDICINE AI. Your consultation token is ${consultation.tokenNumber}. ` +
      `A summary has been saved. Please seek in-person care when needed. This assistant is AI-generated and not a licensed physician.`;

    await this.prisma.consultationMessage.create({
      data: {
        consultationId,
        role: 'SYSTEM',
        content: thankYou,
        metadata: asJson({ thankYou: true }),
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Consultation completed',
        body: `Token ${consultation.tokenNumber} completed. Summary is available.`,
        type: 'consultation_completed',
        metadata: asJson({ consultationId, tokenNumber: consultation.tokenNumber }),
      },
    });

    return this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        thankYouShown: true,
        conversationState: 'COMPLETED',
      },
      include: {
        summary: true,
        messages: { orderBy: { createdAt: 'asc' } },
        prescriptions: true,
        reports: true,
      },
    });
  }
}
