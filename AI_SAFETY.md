# AI safety

## Architecture

Safety is a **separate service** (`SafetyService`) with deterministic emergency rules, not merely prompt text.

## Emergency flow

1. Stop ordinary assessment
2. Show emergency guidance (configurable; India 112/108)
3. Persist `EMERGENCY_STOPPED`
4. Log safety event

## Prohibitions enforced in product copy + filters

- No claiming to be a human physician
- No guaranteed diagnosis
- No legally valid AI prescriptions
- No advice to ignore emergencies

## Clinical eval set (versioned intent)

Covered in unit tests for emergency patterns and RBAC. Expand before production launch with pediatric, pregnancy, false-reassurance, and prompt-injection cases.
