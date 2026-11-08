import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private root: string;

  constructor(private readonly config: ConfigService) {
    this.root = path.resolve(
      this.config.get<string>('LOCAL_STORAGE_PATH') ?? './storage',
    );
  }

  async onModuleInit() {
    await fs.mkdir(this.root, { recursive: true });
  }

  async putObject(params: {
    buffer: Buffer;
    mimeType: string;
    prefix?: string;
    extension?: string;
  }): Promise<{ key: string; checksum: string; sizeBytes: number }> {
    const checksum = createHash('sha256').update(params.buffer).digest('hex');
    const ext = params.extension ?? this.extFromMime(params.mimeType);
    const key = `${params.prefix ?? 'files'}/${randomUUID()}${ext}`;
    const full = path.join(this.root, key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, params.buffer);
    return { key, checksum, sizeBytes: params.buffer.length };
  }

  async getObject(key: string): Promise<Buffer> {
    return fs.readFile(path.join(this.root, key));
  }

  async deleteObject(key: string): Promise<void> {
    await fs.unlink(path.join(this.root, key)).catch(() => undefined);
  }

  resolvePath(key: string) {
    return path.join(this.root, key);
  }

  private extFromMime(mime: string) {
    if (mime === 'application/pdf') return '.pdf';
    if (mime === 'image/jpeg') return '.jpg';
    if (mime === 'image/png') return '.png';
    return '';
  }
}
