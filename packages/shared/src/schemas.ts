import { z } from 'zod';
import { AppointmentStatus, AvatarGender, ConsultationMode, DocumentType } from './enums';

export const createPatientSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  preferredLanguage: z.string().min(2).max(16).default('en'),
  timezone: z.string().min(1).max(64).default('Asia/Kolkata'),
  dateOfBirth: z.string().datetime().optional().nullable(),
  country: z.string().max(64).optional(),
  region: z.string().max(64).optional(),
  heightCm: z.number().positive().max(300).optional().nullable(),
  weightKg: z.number().positive().max(500).optional().nullable(),
  allergies: z.array(z.string().max(120)).optional(),
  conditions: z.array(z.string().max(120)).optional(),
  medications: z.array(z.string().max(120)).optional(),
  emergencyContactName: z.string().max(120).optional().nullable(),
  emergencyContactPhone: z.string().max(40).optional().nullable(),
  consentAiDisclosure: z.boolean(),
  consentTerms: z.boolean(),
  consentPrivacy: z.boolean(),
});

export const updatePatientSchema = createPatientSchema.partial().extend({
  consentAiDisclosure: z.boolean().optional(),
  consentTerms: z.boolean().optional(),
  consentPrivacy: z.boolean().optional(),
});

export const startConsultationSchema = z.object({
  mode: z.nativeEnum(ConsultationMode),
  avatarGender: z.nativeEnum(AvatarGender).optional(),
  language: z.string().min(2).max(16).default('en'),
  reason: z.string().max(2000).optional(),
  useMedicalProfile: z.boolean().default(false),
  appointmentId: z.string().uuid().optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(8000),
  requestId: z.string().uuid().optional(),
});

export const createAppointmentSchema = z.object({
  mode: z.enum([ConsultationMode.CHAT, ConsultationMode.VIDEO]),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(10).max(60).default(20),
  avatarGender: z.nativeEnum(AvatarGender).optional(),
  language: z.string().min(2).max(16).default('en'),
  reason: z.string().max(2000).optional(),
  timezone: z.string().min(1).max(64).default('Asia/Kolkata'),
});

export const updateAppointmentSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  reason: z.string().max(2000).optional(),
  avatarGender: z.nativeEnum(AvatarGender).optional(),
  language: z.string().min(2).max(16).optional(),
});

export const documentUploadMetaSchema = z.object({
  type: z.nativeEnum(DocumentType),
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
});

export const medicationLookupSchema = z.object({
  query: z.string().min(1).max(120),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type StartConsultationInput = z.infer<typeof startConsultationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
