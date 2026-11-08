import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Curated public medical sources — never fabricate citations. */
const SEED_SOURCES = [
  {
    title: 'Fever in adults — when to seek care',
    publisher: 'CDC',
    url: 'https://www.cdc.gov/fever/index.html',
    excerpt: 'Public guidance on fever and when to seek medical care.',
    sourceType: 'government',
    keywords: ['fever', 'temperature', 'chills'],
  },
  {
    title: 'Heart attack symptoms',
    publisher: 'CDC',
    url: 'https://www.cdc.gov/heart-disease/about/heart-attack.html',
    excerpt: 'Recognizing heart attack warning signs.',
    sourceType: 'government',
    keywords: ['chest', 'heart', 'cardiac'],
  },
  {
    title: 'Stroke signs — F.A.S.T.',
    publisher: 'CDC',
    url: 'https://www.cdc.gov/stroke/signs-symptoms/index.html',
    excerpt: 'Face drooping, arm weakness, speech difficulty — time to call emergency services.',
    sourceType: 'government',
    keywords: ['stroke', 'weakness', 'speech'],
  },
  {
    title: 'Cough and cold — self care',
    publisher: 'NHS',
    url: 'https://www.nhs.uk/conditions/cough/',
    excerpt: 'General information about cough and when to get help.',
    sourceType: 'government',
    keywords: ['cough', 'cold', 'sore throat'],
  },
  {
    title: 'Headache — overview',
    publisher: 'NHS',
    url: 'https://www.nhs.uk/conditions/headaches/',
    excerpt: 'Types of headache and urgent warning features.',
    sourceType: 'government',
    keywords: ['headache', 'migraine'],
  },
  {
    title: 'Medicines information',
    publisher: 'FDA',
    url: 'https://www.fda.gov/drugs',
    excerpt: 'Official medicines information portal.',
    sourceType: 'government',
    keywords: ['medicine', 'medication', 'drug'],
  },
];

@Injectable()
export class KnowledgeService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.medicalSource.count();
    if (count === 0) {
      for (const s of SEED_SOURCES) {
        await this.prisma.medicalSource.create({
          data: {
            title: s.title,
            publisher: s.publisher,
            url: s.url,
            excerpt: s.excerpt,
            sourceType: s.sourceType,
          },
        });
      }
    }
  }

  async retrieve(query: string, limit = 3) {
    const q = query.toLowerCase();
    const matched = SEED_SOURCES.filter((s) =>
      s.keywords.some((k) => q.includes(k)),
    ).slice(0, limit);

    if (matched.length === 0) {
      return [];
    }

    const sources = await this.prisma.medicalSource.findMany({
      where: { url: { in: matched.map((m) => m.url) } },
    });
    return sources;
  }
}
