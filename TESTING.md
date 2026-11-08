# Testing

## Unit

```bash
pnpm --filter @telemedicine/api test
```

Covers:

- Emergency safety rules
- Token formatting
- Absence of DOCTOR role

## Manual smoke

1. Open web → Start AI chat (no login)
2. Send mild symptom → receive AI reply
3. Upload prior Rx image
4. End consultation → thank-you + token
5. Generate/download AI Rx record image
6. Send emergency phrase → emergency stop
7. Admin metrics with `x-admin-key`
8. Confirm no doctor routes/roles

## Failure scenarios to rehearse

- AI mock only (default)
- Avatar mock fallback to chat
- Conflicting appointment booking
- Unauthorized cross-patient access
