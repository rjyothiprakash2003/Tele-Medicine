# TELEMEDICINE AI

**Version 1.1.0** · AI-first healthcare information & consultation platform

[![CI](https://github.com/rjyothiprakash2003/Tele-Medicine/actions/workflows/ci.yml/badge.svg)](https://github.com/rjyothiprakash2003/Tele-Medicine/actions/workflows/ci.yml)

Explore symptoms, chat or speak with an AI assistant, receive a consultation **token**, upload prior prescription images, and download an **AI-generated medicines / prescription record** (clearly labeled — **not** a legally valid prescription).

> **Important:** The assistant and video avatar are AI-generated. There is **no human-doctor module**. No login or Gmail setup is required.

---

## Table of contents

1. [Product overview](#1-product-overview)
2. [Screenshots gallery](#2-screenshots-gallery)
3. [Prerequisites](#3-prerequisites)
4. [Step-by-step local setup](#4-step-by-step-local-setup)
5. [How to use the application](#5-how-to-use-the-application)
6. [Project structure](#6-project-structure)
7. [Configuration](#7-configuration)
8. [Testing & CI](#8-testing--ci)
9. [AWS deployment](#9-aws-deployment)
10. [Documentation index](#10-documentation-index)
11. [Known limitations](#11-known-limitations)
12. [License & disclaimer](#12-license--disclaimer)

---

## 1. Product overview

| Capability | Description |
|------------|-------------|
| AI Chat | Guided health conversation with safety checks |
| AI Video | Male / female AI avatar session (mock by default) |
| Symptom assessment | Structured follow-up questions + uncertainty framing |
| Consultation tokens | Sequential IDs like `TM-20261108-00009` |
| Medicines & Rx image | AI medicines table + downloadable PNG record |
| Prior Rx upload | PDF / JPEG / PNG upload during consultation |
| Dashboard | History, documents, notifications, token lookup |
| Appointments | Schedule AI chat/video sessions only |
| Admin | Aggregated ops metrics (`x-admin-key`) |

**Roles:** `PATIENT` · `ADMINISTRATOR` · `SYSTEM_SERVICE`  
**Not included:** doctor registration, doctor dashboards, human prescriptions, email/Gmail login.

---

## 2. Screenshots gallery

### Home

Landing page with brand-first hero and clear AI limitations.

![Home](docs/screenshots/01-home.png)

### How it works

Four-step patient journey from start to token / report.

![How it works](docs/screenshots/02-how-it-works.png)

### AI health chat — start

No sign-in. Click **Begin consultation** to receive a token.

![Chat start](docs/screenshots/03-chat-start.png)

### Active consultation

Token bar, message thread, voice input, prior-Rx upload.

![Active chat](docs/screenshots/04-chat-active.png)

### AI reply with references

Assistant asks focused follow-ups and may cite public sources.

![Chat reply](docs/screenshots/05-chat-reply.png)

### AI medicines & prescription image

After ending a consultation: thank-you message, medicines table, and AI Rx PNG preview.

![AI prescription and medicines](docs/screenshots/06-prescription-medicines.png)

### AI-generated footer

Every medicines/prescription surface includes an **AI GENERATED** notice.

![AI generated footer](docs/screenshots/07-thank-you-ai-footer.png)

### AI video consultation

Male/female avatar, mic/camera, captions, interrupt, chat fallback.

![AI video](docs/screenshots/08-video-consultation.png)

### Symptom assessment

Guided assessment mode for structured symptom intake.

![Assessment](docs/screenshots/09-symptom-assessment.png)

### Patient dashboard

Welcome panel, token lookup, recent consultations, documents, notifications.

![Dashboard](docs/screenshots/10-dashboard.png)

### Appointments

Schedule AI chat or video sessions (no human-doctor calendar).

![Appointments](docs/screenshots/11-appointments.png)

### Patient profile

Optional health details + AI / terms / privacy consents.

![Profile](docs/screenshots/12-profile.png)

### Administrator dashboard

Ops metrics with admin key. Confirms **no doctor role**.

![Admin](docs/screenshots/13-admin-dashboard.png)

### OpenAPI documentation

Interactive API docs at `/docs`.

![API docs](docs/screenshots/14-api-docs.png)

> Screenshots can be refreshed anytime while the stack is running:
>
> ```bash
> node scripts/capture-screenshots.mjs
> ```
> (requires `playwright` and Chromium installed locally)

---

## 3. Prerequisites

Install these before setup:

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | **20+** (22 recommended) | Runtime |
| pnpm | **9.15.0** (via Corepack) | Package manager |
| Docker Desktop | Recent | PostgreSQL (+ optional Redis) |
| Git | Any | Clone the repository |

Optional later:

- OpenAI-compatible API key for real medical LLM responses
- AWS account for CDK deployment

---

## 4. Step-by-step local setup

### Step 1 — Clone the repository

```bash
git clone https://github.com/rjyothiprakash2003/Tele-Medicine.git
cd Tele-Medicine
```

### Step 2 — Enable pnpm (Corepack)

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm -v
```

### Step 3 — Start PostgreSQL (and Redis)

```bash
docker compose up -d
docker compose ps
```

Wait until Postgres is healthy (`tmai-postgres`).

### Step 4 — Install dependencies

```bash
pnpm install
```

### Step 5 — Build shared types

```bash
pnpm --filter @telemedicine/shared build
```

### Step 6 — Configure environment

API defaults already exist for local development at `apps/api/.env`.

If missing, copy from the template:

```bash
cp .env.example apps/api/.env
```

Ensure these values are present:

```env
DATABASE_URL=postgresql://telemedicine:telemedicine@localhost:5432/telemedicine?schema=public
SESSION_SECRET=dev-session-secret-change-in-production-32chars
ADMIN_API_KEY=dev-admin-key
AI_PROVIDER=mock
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Web env (`apps/web/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_APP_NAME=TELEMEDICINE AI
NEXT_PUBLIC_EMERGENCY_NUMBER=112
```

### Step 7 — Generate Prisma client & migrate database

```bash
pnpm --filter @telemedicine/api prisma:generate
pnpm --filter @telemedicine/api exec prisma migrate deploy
# first-time / schema changes during development:
# pnpm --filter @telemedicine/api exec prisma migrate dev
```

### Step 8 — Seed reference data

```bash
pnpm db:seed
```

Seeds avatar configs and AI provider config only — **no real patient data**.

### Step 9 — Start the application

```bash
pnpm dev
```

This starts:

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| OpenAPI | http://localhost:4000/docs |
| Health | http://localhost:4000/api/v1/health |

### Step 10 — Verify health

```bash
curl http://localhost:4000/api/v1/health
```

Expected response includes `"status":"ok"` and `"doctorModule":false`.

---

## 5. How to use the application

### A) Start an AI chat consultation

1. Open http://localhost:3000  
2. Click **Start AI Consultation** (or go to **AI Chat**)  
3. Click **Begin consultation**  
4. Note your **consultation token** (example: `TM-20261108-00009`)  
5. Describe symptoms (e.g. *fever and sore throat*)  
6. Optionally click **Upload prior prescription image**  
7. Click **End consultation & get AI prescription**

You will see:

- Thank-you message with token  
- Medicines table  
- AI prescription PNG preview / download  
- Footer: **AI Generated — Not a legally valid prescription**

### B) AI video consultation

1. Open **AI Video**  
2. Choose male or female AI avatar  
3. Start session → allow mic/camera if prompted  
4. Use interrupt / captions / end session  
5. Chat fallback remains available if avatar audio fails  

### C) Symptom assessment

1. Open **Assessment**  
2. Begin consultation in assessment mode  
3. Answer focused follow-ups  
4. End to generate summary + medicines record  

### D) Dashboard & token lookup

1. Open **Dashboard**  
2. Review recent consultations / documents / notifications  
3. Paste a token (e.g. `TM-20261108-00009`) → **Find token**  

### E) Schedule an AI session

1. Open **Appointments** (from Dashboard → Schedule AI session)  
2. Choose chat or video, date/time, avatar  
3. Confirm — conflicts are blocked automatically  

### F) Administrator metrics

1. Open http://localhost:3000/admin  
2. Enter admin key: `dev-admin-key` (local default)  
3. Click **Load metrics**  

---

## 6. Project structure

```text
Tele-Medicine/
├── apps/
│   ├── web/                 # Next.js 15 frontend
│   └── api/                 # NestJS API + Prisma
├── packages/
│   └── shared/              # Shared enums, Zod schemas, state machine
├── infra/                   # AWS CDK (TypeScript)
├── docs/
│   └── screenshots/         # README screenshots
├── scripts/
│   └── capture-screenshots.mjs
├── docker-compose.yml       # Postgres + Redis
├── .env.example
└── README.md
```

---

## 7. Configuration

| Variable | Default | Meaning |
|----------|---------|---------|
| `AI_PROVIDER` | `mock` | `mock` or OpenAI-compatible |
| `OPENAI_API_KEY` | empty | Enables real LLM when set |
| `AVATAR_PROVIDER` | `mock` | Production avatar vendor later |
| `ENABLE_EMAIL` | `false` | Gmail/SES intentionally unused |
| `ADMIN_API_KEY` | `dev-admin-key` | Admin dashboard access |
| `EMERGENCY_NUMBER` | `112` | India default emergency guidance |

Full reference: [ENVIRONMENT.md](./ENVIRONMENT.md)

---

## 8. Testing & CI

### Unit tests

```bash
pnpm test:unit
```

Covers safety emergency rules, token formatting, medicine suggestions, and absence of a `DOCTOR` role.

### GitHub Actions

On every push to `main`, CI will:

1. Install locked dependencies (pnpm **9.15.0** from `packageManager`)  
2. Build shared package  
3. Run Prisma migrate against ephemeral Postgres  
4. Run unit tests  
5. Build API + Web  

Workflow: `.github/workflows/ci.yml`

---

## 9. AWS deployment

Infrastructure as Code lives in `infra/` (AWS CDK).

```bash
cd infra
pnpm install
npx cdk synth
# npx cdk deploy TelemedicineAiStack   # only in an authorized AWS account
```

Details: [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md)

> This repository documents a deployable architecture. Do **not** assume resources are already provisioned in AWS unless you ran deploy successfully.

---

## 10. Documentation index

| Document | Topic |
|----------|-------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design |
| [API.md](./API.md) | REST contracts |
| [SECURITY.md](./SECURITY.md) | Security controls |
| [PRIVACY.md](./PRIVACY.md) | Data handling |
| [AI_SAFETY.md](./AI_SAFETY.md) | Emergency / safety engine |
| [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) | Cloud deploy |
| [OPERATIONS.md](./OPERATIONS.md) | Runbooks |
| [TESTING.md](./TESTING.md) | Test strategy |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Env vars |
| [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) | Incident process |
| [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) | Implemented vs mocked |

---

## 11. Known limitations

- Default AI and avatar modes are **mock** until provider credentials are configured  
- AI medicines / prescription images are **educational records only**  
- Email / Gmail / Cognito login are intentionally **not** used in v1.1  
- OCR of uploaded prescriptions is minimal (files are stored securely; content treated as untrusted)  
- Full clinical validation is **not** claimed by passing software tests  

---

## 12. License & disclaimer

This software provides **AI-generated health information**.

- Not a licensed medical practice  
- Not emergency care (India: call **112** / ambulance **108**)  
- Not a source of legally valid prescriptions  

Use clinical judgment and qualified healthcare professionals for diagnosis and treatment decisions.

---

**Repository:** https://github.com/rjyothiprakash2003/Tele-Medicine  
**Release tag:** `v1.1.0`
