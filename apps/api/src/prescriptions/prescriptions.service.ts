import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AiService } from '../ai/ai.service';
import { asJson } from '../common/json';
import { suggestMedicinesFromText, SuggestedMedicine } from './medicine-suggestions';

const LEGAL_DISCLAIMER =
  'NOT A LEGALLY VALID PRESCRIPTION. This is an AI-generated consultation medication record for informational purposes only. A licensed prescriber is required where the law mandates it. TELEMEDICINE AI is not a physician.';

const AI_FOOTER = '*** AI GENERATED *** — Educational record only. Not a legally valid prescription. Verify with a licensed clinician before taking medicines.';

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly ai: AiService,
  ) {}

  async listForConsultation(userId: string, consultationId: string) {
    await this.assertConsultation(userId, consultationId);
    return this.prisma.prescriptionDocument.findMany({
      where: { consultationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateFromConsultation(userId: string, consultationId: string) {
    const consultation = await this.assertConsultation(userId, consultationId);

    const prior = await this.prisma.medicalDocument.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [{ consultationId }, { type: 'PRIOR_PRESCRIPTION' }],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const messages = await this.prisma.consultationMessage.findMany({
      where: { consultationId, role: { in: ['USER', 'ASSISTANT'] } },
      orderBy: { createdAt: 'asc' },
      take: 40,
    });

    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
      include: {
        medicalProfile: {
          include: { allergies: true, medications: true, conditions: true },
        },
      },
    });

    const allergies = profile?.medicalProfile?.allergies.map((a) => a.name) ?? [];
    const transcript = [
      consultation.reason ?? '',
      ...messages.map((m) => m.content),
    ].join('\n');

    const medicines = suggestMedicinesFromText(transcript, allergies);

    const review = await this.ai.generateSafe({
      mode: 'prescription_review',
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            token: consultation.tokenNumber,
            patient: profile?.displayName ?? 'Guest Patient',
            allergies,
            currentMedications: profile?.medicalProfile?.medications.map((m) => m.name) ?? [],
            priorPrescriptionUploads: prior.map((p) => p.fileName),
            suggestedMedicines: medicines,
            transcriptExcerpt: messages.map((m) => `${m.role}: ${m.content}`).slice(-12),
          }),
        },
      ],
    });

    const structured = {
      tokenNumber: consultation.tokenNumber,
      patientName: profile?.displayName ?? 'Guest Patient',
      date: new Date().toISOString(),
      reviewedPriorDocuments: prior.map((p) => ({ id: p.id, fileName: p.fileName })),
      medicines,
      educationalNotes: review.content,
      suggestedSupportiveCare: [
        'Rest and adequate hydration unless contraindicated',
        'Monitor symptoms and seek in-person care if worsening',
        'Do not start/stop prescription medicines based solely on this AI record',
      ],
      allergiesNoted: allergies,
      isLegallyValid: false,
      aiGenerated: true,
      footer: AI_FOOTER,
    };

    const png = await this.renderPrescriptionImage(structured);
    const saved = await this.storage.putObject({
      buffer: png,
      mimeType: 'image/png',
      prefix: `prescriptions/${userId}`,
      extension: '.png',
    });

    const record = await this.prisma.prescriptionDocument.create({
      data: {
        consultationId,
        storageKey: saved.key,
        mimeType: 'image/png',
        isLegallyValid: false,
        legalDisclaimer: LEGAL_DISCLAIMER,
        basedOnPriorDocs: prior.length > 0,
        structuredContent: asJson(structured),
      },
    });

    await this.prisma.medicalDocument.create({
      data: {
        userId,
        consultationId,
        type: 'AI_GENERATED_PRESCRIPTION_RECORD',
        fileName: `AI-Rx-Record-${consultation.tokenNumber}.png`,
        mimeType: 'image/png',
        sizeBytes: saved.sizeBytes,
        storageKey: saved.key,
        checksum: saved.checksum,
        status: 'ready',
        extractedText: [
          LEGAL_DISCLAIMER,
          AI_FOOTER,
          ...medicines.map(
            (m, i) =>
              `${i + 1}. ${m.name} ${m.strength} — ${m.dosage}, ${m.frequency}, ${m.duration}`,
          ),
        ].join('\n'),
      },
    });

    // Persist each medicine as an educational treatment recommendation
    for (const med of medicines) {
      await this.prisma.treatmentRecommendation.create({
        data: {
          consultationId,
          title: med.name,
          content: `${med.form} ${med.strength}. Dose: ${med.dosage}. Frequency: ${med.frequency}. Duration: ${med.duration}. Purpose: ${med.purpose}.`,
          isEducational: true,
          disclaimer: LEGAL_DISCLAIMER,
        },
      });
    }

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'AI medication record ready',
        body: `AI-generated medicines list saved for token ${consultation.tokenNumber}. Not a legal prescription.`,
        type: 'prescription_record_ready',
        metadata: asJson({ consultationId, prescriptionId: record.id, medicineCount: medicines.length }),
      },
    });

    return {
      ...record,
      medicines,
      aiGenerated: true,
      footer: AI_FOOTER,
      downloadUrl: `/prescriptions/${record.id}/download`,
    };
  }

  async download(userId: string, id: string) {
    const rx = await this.prisma.prescriptionDocument.findUnique({
      where: { id },
      include: { consultation: true },
    });
    if (!rx) throw new NotFoundException('Prescription record not found');
    if (rx.consultation.userId !== userId) throw new ForbiddenException('Access denied');
    const buffer = await this.storage.getObject(rx.storageKey);
    return { rx, buffer };
  }

  private async assertConsultation(userId: string, consultationId: string) {
    const c = await this.prisma.consultation.findUnique({ where: { id: consultationId } });
    if (!c) throw new NotFoundException('Consultation not found');
    if (c.userId !== userId) throw new ForbiddenException('Access denied');
    if (c.status === 'EMERGENCY_STOPPED') {
      throw new BadRequestException('Cannot generate medication records after an emergency stop');
    }
    return c;
  }

  private async renderPrescriptionImage(data: {
    tokenNumber: string;
    patientName: string;
    date: string;
    educationalNotes: string;
    suggestedSupportiveCare: string[];
    allergiesNoted: string[];
    reviewedPriorDocuments: Array<{ fileName: string }>;
    medicines: SuggestedMedicine[];
  }): Promise<Buffer> {
    const medicineLines: string[] = [];
    data.medicines.forEach((m, i) => {
      medicineLines.push(
        `${i + 1}. ${m.name}`,
        `   ${m.form} | ${m.strength}`,
        `   Dose: ${m.dosage}  |  ${m.frequency}`,
        `   Duration: ${m.duration}`,
        `   For: ${m.purpose}`,
        '',
      );
    });

    const lines = [
      'TELEMEDICINE AI',
      'AI-GENERATED CONSULTATION PRESCRIPTION RECORD',
      '*** NOT A LEGALLY VALID PRESCRIPTION ***',
      '',
      `Token: ${data.tokenNumber}`,
      `Patient: ${escapeXml(data.patientName)}`,
      `Date (UTC): ${data.date.slice(0, 19).replace('T', ' ')}`,
      `Allergies: ${escapeXml(data.allergiesNoted.join(', ') || 'None reported')}`,
      `Prior Rx images reviewed: ${data.reviewedPriorDocuments.length}`,
      '',
      '──────── MEDICINES (AI SUGGESTED) ────────',
      '',
      ...medicineLines.map(escapeXml),
      '──────── SUPPORTIVE CARE ────────',
      ...data.suggestedSupportiveCare.map((s, i) => `${i + 1}. ${escapeXml(s)}`),
      '',
      '──────── AI GENERATED ────────',
      'This document was generated by Artificial Intelligence.',
      'It is for educational / consultation-record purposes only.',
      'It is NOT a legally valid prescription.',
      'Consult a licensed clinician before taking any medicine.',
    ];

    const rowHeight = 20;
    const height = Math.max(1400, 80 + lines.length * rowHeight + 80);

    const textSvg = lines
      .map((line, idx) => {
        const y = 48 + idx * rowHeight;
        const isHeader = idx < 3;
        const isFooter = line.includes('AI GENERATED') || line.includes('Artificial Intelligence') || line.includes('NOT a legally');
        const fill = isHeader || isFooter ? '#b91c1c' : '#0f172a';
        const weight = isHeader || line.startsWith('─') ? '700' : '400';
        return `<text x="40" y="${y}" font-family="Courier New, monospace" font-size="13" font-weight="${weight}" fill="${fill}">${line}</text>`;
      })
      .join('\n');

    const footerY = height - 36;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="900" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <rect x="20" y="20" width="860" height="${height - 40}" fill="#ffffff" stroke="#0f766e" stroke-width="3"/>
  <rect x="20" y="20" width="860" height="10" fill="#0f766e"/>
  ${textSvg}
  <rect x="20" y="${footerY - 18}" width="860" height="38" fill="#0f766e"/>
  <text x="450" y="${footerY + 6}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#ffffff">AI GENERATED — NOT A LEGALLY VALID PRESCRIPTION</text>
</svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
  }
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
