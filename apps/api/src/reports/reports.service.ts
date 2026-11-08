import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { asJson } from '../common/json';

const DISCLAIMER =
  'AI-generated consultation report. Not a medical diagnosis. Not a legally valid prescription. TELEMEDICINE AI is not a licensed physician.';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(userId: string) {
    return this.prisma.medicalReport.findMany({
      where: { consultation: { userId } },
      orderBy: { createdAt: 'desc' },
      include: { consultation: { select: { tokenNumber: true, mode: true } } },
    });
  }

  async createFromConsultation(userId: string, consultationId: string) {
    const c = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        summary: true,
        messages: { orderBy: { createdAt: 'asc' } },
        assessment: true,
        prescriptions: true,
      },
    });
    if (!c) throw new NotFoundException('Consultation not found');
    if (c.userId !== userId) throw new ForbiddenException('Access denied');

    const contentJson = {
      tokenNumber: c.tokenNumber,
      mode: c.mode,
      mainConcern: c.reason ?? c.summary?.mainConcern ?? null,
      summary: c.summary?.summaryText ?? null,
      messageCount: c.messages.length,
      safetyOutcome: c.safetyOutcome,
      prescriptionRecords: c.prescriptions.map((p) => ({
        id: p.id,
        isLegallyValid: p.isLegallyValid,
      })),
      generatedAt: new Date().toISOString(),
    };

    const pdf = await this.buildPdf(contentJson);
    const saved = await this.storage.putObject({
      buffer: pdf,
      mimeType: 'application/pdf',
      prefix: `reports/${userId}`,
      extension: '.pdf',
    });

    const report = await this.prisma.medicalReport.create({
      data: {
        consultationId,
        title: `Consultation Report ${c.tokenNumber}`,
        contentJson: asJson(contentJson),
        pdfStorageKey: saved.key,
        disclaimer: DISCLAIMER,
      },
    });

    await this.prisma.medicalDocument.create({
      data: {
        userId,
        consultationId,
        type: 'CONSULTATION_REPORT_PDF',
        fileName: `report-${c.tokenNumber}.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: saved.sizeBytes,
        storageKey: saved.key,
        checksum: saved.checksum,
        status: 'ready',
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Report available',
        body: `Consultation report for token ${c.tokenNumber} is ready to download.`,
        type: 'report_available',
        metadata: asJson({ reportId: report.id, consultationId }),
      },
    });

    return report;
  }

  async get(userId: string, id: string) {
    const report = await this.prisma.medicalReport.findUnique({
      where: { id },
      include: { consultation: true },
    });
    if (!report) throw new NotFoundException('Report not found');
    if (report.consultation.userId !== userId) throw new ForbiddenException('Access denied');
    return report;
  }

  async exportPdf(userId: string, id: string) {
    const report = await this.get(userId, id);
    if (!report.pdfStorageKey) throw new NotFoundException('PDF not available');
    const buffer = await this.storage.getObject(report.pdfStorageKey);
    return { report, buffer };
  }

  private buildPdf(content: Record<string, unknown>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).fillColor('#0f766e').text('TELEMEDICINE AI', { align: 'left' });
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor('#0f172a').text('AI Consultation Report');
      doc.moveDown();
      doc.fontSize(10).fillColor('#b91c1c').text(DISCLAIMER, { align: 'left' });
      doc.moveDown();
      doc.fillColor('#0f172a').fontSize(11);
      for (const [k, v] of Object.entries(content)) {
        doc.text(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
        doc.moveDown(0.4);
      }
      doc.end();
    });
  }
}
