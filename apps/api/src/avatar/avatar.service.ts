import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AvatarProvider } from '../ai/ai.interfaces';

class MockAvatarProvider implements AvatarProvider {
  readonly name = 'mock';
  private sessions = new Map<string, { consultationId: string; gender: string }>();

  async createSession(params: {
    consultationId: string;
    gender: 'MALE' | 'FEMALE';
    voiceId?: string;
  }) {
    const sessionId = randomUUID();
    this.sessions.set(sessionId, {
      consultationId: params.consultationId,
      gender: params.gender,
    });
    return {
      sessionId,
      clientToken: `mock-token-${sessionId}`,
      mock: true,
    };
  }

  async interrupt(sessionId: string) {
    if (!this.sessions.has(sessionId)) return;
  }

  async end(sessionId: string) {
    this.sessions.delete(sessionId);
  }
}

@Injectable()
export class AvatarService {
  private readonly provider: AvatarProvider;
  private readonly meta = new Map<
    string,
    { userId: string; consultationId: string; state: string }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    // Production avatar credentials are optional; mock is default and labeled.
    this.provider = new MockAvatarProvider();
  }

  getProviderName() {
    return this.provider.name;
  }

  async createVoiceSession(
    userId: string,
    consultationId: string,
    gender: 'MALE' | 'FEMALE' = 'FEMALE',
  ) {
    const c = await this.prisma.consultation.findUnique({ where: { id: consultationId } });
    if (!c) throw new NotFoundException('Consultation not found');
    if (c.userId !== userId) throw new ForbiddenException('Access denied');

    const session = await this.provider.createSession({
      consultationId,
      gender,
    });

    this.meta.set(session.sessionId, {
      userId,
      consultationId,
      state: 'READY',
    });

    await this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        conversationState: 'READY',
        avatarGender: gender,
      },
    });

    return {
      ...session,
      provider: this.provider.name,
      states: [
        'INITIALIZING',
        'READY',
        'LISTENING',
        'TRANSCRIBING',
        'PROCESSING',
        'SAFETY_REVIEW',
        'SPEAKING',
        'INTERRUPTED',
        'RECONNECTING',
        'COMPLETED',
        'ERROR',
        'EMERGENCY',
      ],
      disclosure:
        'The video character is an AI-generated avatar, not a real or licensed physician.',
    };
  }

  async token(userId: string, sessionId: string) {
    const meta = this.meta.get(sessionId);
    if (!meta || meta.userId !== userId) throw new ForbiddenException('Invalid session');
    return {
      sessionId,
      clientToken: `mock-token-${sessionId}`,
      expiresInSeconds: 300,
      mock: true,
    };
  }

  async interrupt(userId: string, sessionId: string) {
    const meta = this.meta.get(sessionId);
    if (!meta || meta.userId !== userId) throw new ForbiddenException('Invalid session');
    await this.provider.interrupt(sessionId);
    meta.state = 'INTERRUPTED';
    await this.prisma.consultation.update({
      where: { id: meta.consultationId },
      data: { conversationState: 'INTERRUPTED' },
    });
    return { ok: true, state: 'INTERRUPTED' };
  }

  async end(userId: string, sessionId: string) {
    const meta = this.meta.get(sessionId);
    if (!meta || meta.userId !== userId) throw new ForbiddenException('Invalid session');
    await this.provider.end(sessionId);
    this.meta.delete(sessionId);
    return { ok: true };
  }
}
