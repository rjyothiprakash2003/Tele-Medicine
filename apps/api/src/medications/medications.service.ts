import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SEED = [
  {
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    summary: 'Common analgesic and antipyretic used for mild pain and fever.',
    sideEffects: 'Rare liver toxicity at overdose; nausea possible.',
    contraindications: 'Severe hepatic impairment; known hypersensitivity.',
    interactionsNote: 'Risk increases with alcohol or other hepatotoxic agents.',
    sourceLabel: 'Educational summary — verify with official label / clinician',
    sourceUrl: 'https://www.fda.gov/drugs',
  },
  {
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    summary: 'NSAID used for pain, inflammation, and fever.',
    sideEffects: 'Stomach upset, ulcer risk, kidney effects possible.',
    contraindications: 'Active peptic ulcer; late pregnancy caution; NSAID allergy.',
    interactionsNote: 'May interact with anticoagulants, some antihypertensives.',
    sourceLabel: 'Educational summary — verify with official label / clinician',
    sourceUrl: 'https://www.fda.gov/drugs',
  },
  {
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    summary: 'Penicillin-class antibiotic for certain bacterial infections (prescription-only in many jurisdictions).',
    sideEffects: 'Diarrhea, rash; allergic reactions possible.',
    contraindications: 'Penicillin allergy.',
    interactionsNote: 'May reduce efficacy of some oral contraceptives; discuss with clinician.',
    sourceLabel: 'Educational summary — not a prescribing recommendation',
    sourceUrl: 'https://www.fda.gov/drugs',
  },
];

@Injectable()
export class MedicationsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.medicationInformation.count();
    if (count === 0) {
      await this.prisma.medicationInformation.createMany({ data: SEED });
    }
  }

  lookup(query: string) {
    return this.prisma.medicationInformation.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { genericName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
  }
}
