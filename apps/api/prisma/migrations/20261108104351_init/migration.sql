-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'ADMINISTRATOR', 'SYSTEM_SERVICE');

-- CreateEnum
CREATE TYPE "ConsultationMode" AS ENUM ('CHAT', 'VIDEO', 'ASSESSMENT');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'EMERGENCY_STOPPED', 'ERROR');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AvatarGender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "SafetySeverity" AS ENUM ('INFO', 'WARNING', 'HIGH', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PRIOR_PRESCRIPTION', 'LAB_REPORT', 'OTHER_MEDICAL', 'AI_GENERATED_PRESCRIPTION_RECORD', 'CONSULTATION_REPORT_PDF');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'SAFETY');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PATIENT',
    "session_token" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "display_name" TEXT,
    "preferred_language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "date_of_birth" TIMESTAMP(3),
    "country" TEXT,
    "region" TEXT,
    "height_cm" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "consent_ai_disclosure" BOOLEAN NOT NULL DEFAULT false,
    "consent_terms" BOOLEAN NOT NULL DEFAULT false,
    "consent_privacy" BOOLEAN NOT NULL DEFAULT false,
    "privacy_prefs" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_consents" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "ip_hint" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_profiles" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_conditions" (
    "id" UUID NOT NULL,
    "medical_profile_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'reported',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_allergies" (
    "id" UUID NOT NULL,
    "medical_profile_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "severity" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_medications" (
    "id" UUID NOT NULL,
    "medical_profile_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "mode" "ConsultationMode" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 20,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "avatar_gender" "AvatarGender",
    "language" TEXT NOT NULL DEFAULT 'en',
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_counters" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "date_key" TEXT NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "appointment_id" UUID,
    "token_number" TEXT NOT NULL,
    "mode" "ConsultationMode" NOT NULL,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatar_gender" "AvatarGender",
    "language" TEXT NOT NULL DEFAULT 'en',
    "reason" TEXT,
    "use_medical_profile" BOOLEAN NOT NULL DEFAULT false,
    "consent_state" JSONB,
    "safety_outcome" TEXT,
    "conversation_state" TEXT NOT NULL DEFAULT 'READY',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "thank_you_shown" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_messages" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "request_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_transcripts" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_summaries" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "main_concern" TEXT,
    "summary_text" TEXT NOT NULL,
    "structured" JSONB,
    "disclaimer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_sources" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "retrieved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "excerpt" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_results" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "reported_facts" JSONB NOT NULL,
    "extracted_from_records" JSONB,
    "ai_interpretations" JSONB NOT NULL,
    "unknowns" JSONB,
    "possible_explanations" JSONB,
    "uncertainties" TEXT,
    "next_steps" TEXT,
    "emergency_triggered" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_source_links" (
    "id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,

    CONSTRAINT "assessment_source_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_documents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "consultation_id" UUID,
    "type" "DocumentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "checksum" TEXT,
    "extracted_text" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "medical_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_recommendations" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_educational" BOOLEAN NOT NULL DEFAULT true,
    "disclaimer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treatment_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_information" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "generic_name" TEXT,
    "summary" TEXT NOT NULL,
    "side_effects" TEXT,
    "contraindications" TEXT,
    "interactions_note" TEXT,
    "source_label" TEXT NOT NULL,
    "source_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_documents" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL DEFAULT 'image/png',
    "is_legally_valid" BOOLEAN NOT NULL DEFAULT false,
    "legal_disclaimer" TEXT NOT NULL,
    "based_on_prior_docs" BOOLEAN NOT NULL DEFAULT false,
    "structured_content" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescription_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_reports" (
    "id" UUID NOT NULL,
    "consultation_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content_json" JSONB NOT NULL,
    "pdf_storage_key" TEXT,
    "disclaimer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "reminders_enabled" BOOLEAN NOT NULL DEFAULT true,
    "security_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_events" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "consultation_id" UUID,
    "severity" "SafetySeverity" NOT NULL,
    "rule_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_provider_configs" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_provider_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avatar_configs" (
    "id" UUID NOT NULL,
    "gender" "AvatarGender" NOT NULL,
    "label" TEXT NOT NULL,
    "voice_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avatar_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_session_token_key" ON "users"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "patient_profiles_user_id_key" ON "patient_profiles"("user_id");

-- CreateIndex
CREATE INDEX "patient_consents_profile_id_idx" ON "patient_consents"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "medical_profiles_profile_id_key" ON "medical_profiles"("profile_id");

-- CreateIndex
CREATE INDEX "medical_conditions_medical_profile_id_idx" ON "medical_conditions"("medical_profile_id");

-- CreateIndex
CREATE INDEX "patient_allergies_medical_profile_id_idx" ON "patient_allergies"("medical_profile_id");

-- CreateIndex
CREATE INDEX "patient_medications_medical_profile_id_idx" ON "patient_medications"("medical_profile_id");

-- CreateIndex
CREATE INDEX "appointments_user_id_scheduled_at_idx" ON "appointments"("user_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "appointments_status_scheduled_at_idx" ON "appointments"("status", "scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "token_counters_date_key_key" ON "token_counters"("date_key");

-- CreateIndex
CREATE UNIQUE INDEX "consultations_token_number_key" ON "consultations"("token_number");

-- CreateIndex
CREATE INDEX "consultations_user_id_created_at_idx" ON "consultations"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "consultations_token_number_idx" ON "consultations"("token_number");

-- CreateIndex
CREATE INDEX "consultation_messages_consultation_id_created_at_idx" ON "consultation_messages"("consultation_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_transcripts_consultation_id_key" ON "consultation_transcripts"("consultation_id");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_summaries_consultation_id_key" ON "consultation_summaries"("consultation_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_results_consultation_id_key" ON "assessment_results"("consultation_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_source_links_assessment_id_source_id_key" ON "assessment_source_links"("assessment_id", "source_id");

-- CreateIndex
CREATE INDEX "medical_documents_user_id_idx" ON "medical_documents"("user_id");

-- CreateIndex
CREATE INDEX "treatment_recommendations_consultation_id_idx" ON "treatment_recommendations"("consultation_id");

-- CreateIndex
CREATE INDEX "medication_information_name_idx" ON "medication_information"("name");

-- CreateIndex
CREATE INDEX "prescription_documents_consultation_id_idx" ON "prescription_documents"("consultation_id");

-- CreateIndex
CREATE INDEX "medical_reports_consultation_id_idx" ON "medical_reports"("consultation_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "safety_events_severity_created_at_idx" ON "safety_events"("severity", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_provider_configs_name_key" ON "ai_provider_configs"("name");

-- CreateIndex
CREATE INDEX "admin_audit_logs_created_at_idx" ON "admin_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "security_events_created_at_idx" ON "security_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_key_key" ON "idempotency_records"("key");

-- AddForeignKey
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_consents" ADD CONSTRAINT "patient_consents_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_profiles" ADD CONSTRAINT "medical_profiles_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "patient_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_conditions" ADD CONSTRAINT "medical_conditions_medical_profile_id_fkey" FOREIGN KEY ("medical_profile_id") REFERENCES "medical_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_allergies" ADD CONSTRAINT "patient_allergies_medical_profile_id_fkey" FOREIGN KEY ("medical_profile_id") REFERENCES "medical_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_medications" ADD CONSTRAINT "patient_medications_medical_profile_id_fkey" FOREIGN KEY ("medical_profile_id") REFERENCES "medical_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_messages" ADD CONSTRAINT "consultation_messages_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_transcripts" ADD CONSTRAINT "consultation_transcripts_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_summaries" ADD CONSTRAINT "consultation_summaries_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_source_links" ADD CONSTRAINT "assessment_source_links_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessment_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_source_links" ADD CONSTRAINT "assessment_source_links_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "medical_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_recommendations" ADD CONSTRAINT "treatment_recommendations_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_documents" ADD CONSTRAINT "prescription_documents_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_reports" ADD CONSTRAINT "medical_reports_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_events" ADD CONSTRAINT "safety_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_events" ADD CONSTRAINT "safety_events_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
