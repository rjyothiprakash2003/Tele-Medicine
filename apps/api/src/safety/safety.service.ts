import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SafetySeverity } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { asJson } from '../common/json';
import { DANGEROUS_ADVICE_PATTERNS, EMERGENCY_RULES } from './emergency-rules';

export type SafetyEvaluation = {
  severity: SafetySeverity;
  isEmergency: boolean;
  ruleIds: string[];
  message: string;
  emergencyGuidance?: {
    primaryNumber: string;
    ambulanceNumber: string;
    region: string;
    guidance: string;
  };
  blockResponse: boolean;
};

@Injectable()
export class SafetyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  evaluateUserText(text: string): SafetyEvaluation {
    const hits = EMERGENCY_RULES.filter((r) => r.pattern.test(text));
    if (hits.length > 0) {
      const primary = this.config.get<string>('EMERGENCY_NUMBER') ?? '112';
      const ambulance = this.config.get<string>('EMERGENCY_AMBULANCE') ?? '108';
      const region = this.config.get<string>('EMERGENCY_REGION') ?? 'IN';
      return {
        severity: 'EMERGENCY',
        isEmergency: true,
        ruleIds: hits.map((h) => h.id),
        message: hits.map((h) => h.message).join(' '),
        emergencyGuidance: {
          primaryNumber: primary,
          ambulanceNumber: ambulance,
          region,
          guidance: `If you may be experiencing a medical emergency, call ${primary} (or ambulance ${ambulance} in ${region}) or go to the nearest emergency department immediately. Do not wait for an AI assessment.`,
        },
        blockResponse: true,
      };
    }

    return {
      severity: 'INFO',
      isEmergency: false,
      ruleIds: [],
      message: 'No emergency pattern matched.',
      blockResponse: false,
    };
  }

  evaluateAssistantText(text: string): SafetyEvaluation {
    const dangerous = DANGEROUS_ADVICE_PATTERNS.some((p) => p.test(text));
    if (dangerous) {
      return {
        severity: 'HIGH',
        isEmergency: false,
        ruleIds: ['dangerous_advice'],
        message: 'Potentially dangerous advice detected in draft response.',
        blockResponse: true,
      };
    }

    const claimsPhysician =
      /\b(i am (a |your )?doctor|i'?m (a |your )?doctor|as your physician|i am a licensed physician)\b/i.test(
        text,
      ) && !/\b(not a (licensed )?physician|not a (licensed )?doctor|ai[- ]generated)\b/i.test(text);
    if (claimsPhysician) {
      return {
        severity: 'WARNING',
        isEmergency: false,
        ruleIds: ['impersonation'],
        message: 'Response improperly claimed to be a human physician.',
        blockResponse: true,
      };
    }

    return {
      severity: 'INFO',
      isEmergency: false,
      ruleIds: [],
      message: 'Assistant draft passed safety checks.',
      blockResponse: false,
    };
  }

  async logEvent(params: {
    userId?: string;
    consultationId?: string;
    severity: SafetySeverity;
    ruleId: string;
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.safetyEvent.create({
      data: {
        userId: params.userId,
        consultationId: params.consultationId,
        severity: params.severity,
        ruleId: params.ruleId,
        message: params.message,
        metadata: asJson(params.metadata ?? {}),
      },
    });
  }
}
