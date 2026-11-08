# Environment

Copy `.env.example` values into:

- `apps/api/.env`
- `apps/web/.env.local`

## Important flags

| Variable | Default | Notes |
|----------|---------|-------|
| `AI_PROVIDER` | `mock` | set `openai` + `OPENAI_API_KEY` for real LLM |
| `AVATAR_PROVIDER` | `mock` | production avatar key required for live avatars |
| `ENABLE_EMAIL` | `false` | Gmail/SES not used |
| `ADMIN_API_KEY` | required for `/admin` | |
| `EMERGENCY_NUMBER` | `112` | India default |

Never commit real secrets.
