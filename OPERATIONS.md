# Operations

## Local services

```bash
docker compose up -d
pnpm dev
```

## Migrations

```bash
pnpm --filter @telemedicine/api exec prisma migrate deploy
```

## Backups (AWS)

- Enable RDS automated backups (retention ≥ 7 days for non-prod; follow policy for prod)
- Document restore drills before go-live

## Secret rotation

- Rotate `SESSION_SECRET`, `ADMIN_API_KEY`, and provider keys via Secrets Manager

## Rollback

- Redeploy previous ECS task definition
- Reverse migrate only with explicit approval
