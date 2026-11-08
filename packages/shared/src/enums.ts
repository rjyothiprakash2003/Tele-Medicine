export const UserRole = {
  PATIENT: 'PATIENT',
  ADMINISTRATOR: 'ADMINISTRATOR',
  SYSTEM_SERVICE: 'SYSTEM_SERVICE',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Explicit: DOCTOR role is intentionally not defined. */

export const ConsultationMode = {
  CHAT: 'CHAT',
  VIDEO: 'VIDEO',
  ASSESSMENT: 'ASSESSMENT',
} as const;
export type ConsultationMode = (typeof ConsultationMode)[keyof typeof ConsultationMode];

export const ConsultationStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EMERGENCY_STOPPED: 'EMERGENCY_STOPPED',
  ERROR: 'ERROR',
} as const;
export type ConsultationStatus = (typeof ConsultationStatus)[keyof typeof ConsultationStatus];

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  RESCHEDULED: 'RESCHEDULED',
  NO_SHOW: 'NO_SHOW',
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const AvatarGender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;
export type AvatarGender = (typeof AvatarGender)[keyof typeof AvatarGender];

export const SafetySeverity = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  HIGH: 'HIGH',
  EMERGENCY: 'EMERGENCY',
} as const;
export type SafetySeverity = (typeof SafetySeverity)[keyof typeof SafetySeverity];

export const DocumentType = {
  PRIOR_PRESCRIPTION: 'PRIOR_PRESCRIPTION',
  LAB_REPORT: 'LAB_REPORT',
  OTHER_MEDICAL: 'OTHER_MEDICAL',
  AI_GENERATED_PRESCRIPTION_RECORD: 'AI_GENERATED_PRESCRIPTION_RECORD',
  CONSULTATION_REPORT_PDF: 'CONSULTATION_REPORT_PDF',
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const MessageRole = {
  USER: 'USER',
  ASSISTANT: 'ASSISTANT',
  SYSTEM: 'SYSTEM',
  SAFETY: 'SAFETY',
} as const;
export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];
