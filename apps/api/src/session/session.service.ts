import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export type SessionUser = {
  id: string;
  role: string;
  sessionToken: string;
};

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  cookieName() {
    return this.config.get<string>('SESSION_COOKIE_NAME') ?? 'tmai_session';
  }

  async resolveOrCreate(req: Request, res: Response): Promise<SessionUser> {
    const token = req.cookies?.[this.cookieName()] as string | undefined;
    if (token) {
      const existing = await this.prisma.user.findUnique({ where: { sessionToken: token } });
      if (existing && existing.isActive && !existing.deletedAt) {
        return { id: existing.id, role: existing.role, sessionToken: existing.sessionToken };
      }
    }

    const sessionToken = randomUUID();
    const user = await this.prisma.user.create({
      data: {
        role: 'PATIENT',
        sessionToken,
        patientProfile: {
          create: {
            displayName: 'Guest Patient',
            preferredLanguage: 'en',
            timezone: 'Asia/Kolkata',
            consentAiDisclosure: false,
            consentTerms: false,
            consentPrivacy: false,
            medicalProfile: { create: {} },
          },
        },
      },
    });

    res.cookie(this.cookieName(), sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('NODE_ENV') === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 30,
      path: '/',
    });

    return { id: user.id, role: user.role, sessionToken };
  }

  async getByToken(token: string): Promise<SessionUser | null> {
    const user = await this.prisma.user.findUnique({ where: { sessionToken: token } });
    if (!user || !user.isActive || user.deletedAt) return null;
    return { id: user.id, role: user.role, sessionToken: user.sessionToken };
  }
}
