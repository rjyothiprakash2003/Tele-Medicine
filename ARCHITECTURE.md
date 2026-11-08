# TELEMEDICINE AI — Architecture

## Product summary

TELEMEDICINE AI is an AI-first healthcare information and consultation platform. Patients interact with an AI assistant via chat and interactive video avatars. There is **no human-doctor module**.

### Access model (project decision)

- **No login / registration** — patients start consultations immediately.
- **No email / Gmail configuration** — notifications are in-app only.
- An anonymous **session patient** is created on first visit (cookie + UUID).
- Each consultation receives a sequential **token number** (e.g. `TM-20261108-00042`).

### Legal / safety disclosures

- The video character is an **AI-generated avatar**, not a licensed physician.
- AI-generated “prescription” images are **educational consultation records only**, not legally valid prescriptions.
- Emergency patterns interrupt normal flow and show local emergency guidance (configurable; India default: 112 / 108).

## Repository layout

```
/
├── apps/
│   ├── web/          # Next.js App Router (frontend)
│   └── api/          # NestJS REST + WebSocket API
├── packages/
│   ├── shared/       # Shared TypeScript types & Zod schemas
│   └── config/       # Shared ESLint/TS configs
├── infra/            # AWS CDK (TypeScript)
├── docs/             # Additional operational docs
└── .github/workflows # CI/CD
```

## Runtime stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 15, React 19, Tailwind CSS, TanStack Query, Zod, RHF |
| Backend | NestJS 11, Prisma, PostgreSQL, Redis (optional) |
| Auth | Session cookie (anonymous patient UUID) — no Cognito in this build |
| AI | Provider interfaces + MockMedicalAI (OpenAI-compatible optional) |
| Avatar | Provider interface + MockAvatar (canvas/Web Speech) |
| STT/TTS | Browser Web Speech API in mock; provider adapters for production |
| Storage | Local filesystem in dev; S3 in AWS |
| IaC | AWS CDK |

## Roles (RBAC)

- `PATIENT` — session-backed anonymous/guest patient
- `ADMINISTRATOR` — platform ops (env-gated admin key)
- `SYSTEM_SERVICE` — machine jobs

**No `DOCTOR` role.**

## Core domains

1. **Sessions / Patients** — anonymous profile + optional health details
2. **Consultations** — chat / video, token numbers, transcripts, summaries
3. **Safety Engine** — deterministic emergency rules + AI classification
4. **Assessments** — guided symptom workflow with uncertainty
5. **Documents** — prior Rx uploads + AI-generated Rx image records
6. **Appointments** — AI session scheduling only
7. **Admin** — aggregated metrics, health, safety counts

## AI video pipeline

```
Mic → VAD → STT → ConversationState → MedicalAI → Safety → TTS → Avatar
```

States: `INITIALIZING | READY | LISTENING | TRANSCRIBING | PROCESSING | SAFETY_REVIEW | SPEAKING | INTERRUPTED | RECONNECTING | COMPLETED | ERROR | EMERGENCY`

## AWS deployment (high level)

```
Route53 → CloudFront → ALB → ECS Fargate (web + api)
                              ├─ RDS PostgreSQL (private)
                              ├─ ElastiCache Redis (optional)
                              ├─ S3 (documents)
                              ├─ Secrets Manager / KMS
                              └─ CloudWatch
```

See `AWS_DEPLOYMENT.md` for details.

## Known intentional simplifications

- No Cognito / email verification (per product decision).
- Avatar production providers require credentials; mock mode is default.
- AI Rx images are labeled non-legal; issuance of valid prescriptions is disabled.
