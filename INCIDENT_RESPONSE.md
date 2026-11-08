# Incident response

1. Identify severity (P1 service down / P1 data exposure / P2 degraded AI / P3 cosmetic)
2. Disable affected feature flags (`AI_PROVIDER`, avatar sessions) if needed
3. Preserve CloudWatch logs and security events
4. Rotate compromised secrets
5. Notify affected users via in-app notification only (no email in this build)
6. Post-incident review within 5 business days
