import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

const ALLOWED = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const MAGIC = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
};

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(userId: string) {
    return this.prisma.medicalDocument.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upload(
    userId: string,
    file: Express.Multer.File,
    type: DocumentType,
    consultationId?: string,
  ) {
    if (!file) throw new BadRequestException('File required');
    if (!ALLOWED.has(file.mimetype)) {
      throw new BadRequestException('Only PDF, JPEG, PNG allowed');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Max file size is 10MB');
    }
    this.assertMagic(file.buffer, file.mimetype);

    if (consultationId) {
      const c = await this.prisma.consultation.findUnique({ where: { id: consultationId } });
      if (!c || c.userId !== userId) throw new ForbiddenException('Invalid consultation');
    }

    const saved = await this.storage.putObject({
      buffer: file.buffer,
      mimeType: file.mimetype,
      prefix: `documents/${userId}`,
    });

    return this.prisma.medicalDocument.create({
      data: {
        userId,
        consultationId,
        type,
        fileName: file.originalname.slice(0, 255),
        mimeType: file.mimetype,
        sizeBytes: saved.sizeBytes,
        storageKey: saved.key,
        checksum: saved.checksum,
        status: 'ready',
        extractedText:
          type === 'PRIOR_PRESCRIPTION'
            ? '[Image/PDF stored. OCR optional; treat as untrusted patient-uploaded content.]'
            : null,
      },
    });
  }

  async getFile(userId: string, id: string) {
    const doc = await this.prisma.medicalDocument.findUnique({ where: { id } });
    if (!doc || doc.deletedAt) throw new NotFoundException('Document not found');
    if (doc.userId !== userId) throw new ForbiddenException('Access denied');
    const buffer = await this.storage.getObject(doc.storageKey);
    return { doc, buffer };
  }

  async remove(userId: string, id: string) {
    const doc = await this.prisma.medicalDocument.findUnique({ where: { id } });
    if (!doc || doc.deletedAt) throw new NotFoundException('Document not found');
    if (doc.userId !== userId) throw new ForbiddenException('Access denied');
    await this.prisma.medicalDocument.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'deleted' },
    });
    return { ok: true };
  }

  private assertMagic(buf: Buffer, mime: string) {
    const check = (sig: number[]) => sig.every((b, i) => buf[i] === b);
    if (mime === 'application/pdf' && !check(MAGIC.pdf)) {
      throw new BadRequestException('Invalid PDF signature');
    }
    if (mime === 'image/jpeg' && !check(MAGIC.jpeg)) {
      throw new BadRequestException('Invalid JPEG signature');
    }
    if (mime === 'image/png' && !check(MAGIC.png)) {
      throw new BadRequestException('Invalid PNG signature');
    }
  }
}
