# TELEMEDICINE AI

AI-first healthcare information and consultation platform.

**No human-doctor module. No login/register. No Gmail/email configuration.**

Patients start AI chat or AI video consultations immediately. Each consultation receives a sequential **token number** (e.g. `TM-20261108-00042`). Prior prescription images can be uploaded; the system can generate an **AI medication record image** that is explicitly **not a legally valid prescription**. A thank-you message is shown when a consultation completes.

## Stack

- `apps/web` — Next.js 15 (App Router) + Tailwind
- `apps/api` — NestJS + Prisma + PostgreSQL
- `packages/shared` — shared enums/schemas/state machine
- `infra` — AWS CDK (TypeScript)
- Mock AI + mock avatar by default; OpenAI-compatible optional

## Quick start (local)

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)

```bash
# 1) Start database
docker compose up -d

# 2) Install
pnpm install

# 3) Shared package
pnpm --filter @telemedicine/shared build

# 4) API env is already at apps/api/.env (dev defaults)
pnpm --filter @telemedicine/api prisma:generate
pnpm --filter @telemedicine/api exec prisma migrate dev --name init
pnpm db:seed

# 5) Run API + Web
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1
- OpenAPI: http://localhost:4000/docs
- Admin metrics: `GET /api/v1/admin/metrics` with header `x-admin-key: dev-admin-key`

## Product notes

| Topic | Behavior |
|-------|----------|
| Auth | Anonymous session cookie; no email signup |
| Email | Disabled (`ENABLE_EMAIL=false`) |
| AI | `AI_PROVIDER=mock` by default |
| Avatar | Mock canvas + Web Speech; provider interface ready |
| Prescriptions | AI-generated PNG records marked `isLegallyValid=false` |
| Emergency | Deterministic rules; India defaults 112 / 108 |
| Roles | `PATIENT`, `ADMINISTRATOR`, `SYSTEM_SERVICE` only |

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [API.md](./API.md)
- [SECURITY.md](./SECURITY.md)
- [PRIVACY.md](./PRIVACY.md)
- [AI_SAFETY.md](./AI_SAFETY.md)
- [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md)
- [OPERATIONS.md](./OPERATIONS.md)
- [TESTING.md](./TESTING.md)
- [ENVIRONMENT.md](./ENVIRONMENT.md)
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)

## Tests

```bash
pnpm test:unit
```

## Status honesty

See **Known limitations** in `ARCHITECTURE.md` and the final status section of the handoff notes. Features that require third-party credentials (production avatar vendors, real OpenAI keys, SES) run in labeled mock/disabled mode until configured.
