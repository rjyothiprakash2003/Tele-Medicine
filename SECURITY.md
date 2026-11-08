# Security

## Controls implemented

- Session cookie (`httpOnly`, `sameSite=lax`)
- Ownership checks on consultations, documents, reports, prescriptions
- Zod/class-validator input validation
- File MIME + magic-byte checks; 10MB limit
- Admin routes gated by `x-admin-key`
- No secrets in frontend bundle
- Safety event logging with minimal necessary data
- Local encrypted-at-rest storage path in AWS design (KMS/S3 SSE)

## Threat model (summary)

| Threat | Mitigation |
|--------|------------|
| Patient A reads Patient B data | Session ownership checks |
| Prompt injection via uploads | Uploads treated untrusted; not executed |
| Emergency missed by LLM only | Deterministic rule engine |
| Prescription misuse | `isLegallyValid=false`; legal disclaimer on image |
| Secret leakage | Env validation; Secrets Manager in AWS design |

## Not claimed

This repository does **not** claim HIPAA/GDPR/DPDP certification solely by using AWS.
