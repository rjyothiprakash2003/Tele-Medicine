# AWS deployment

Infrastructure as code lives in `infra/` (AWS CDK).

## Recommended pattern

Route 53 → CloudFront → ALB → ECS Fargate (`web`, `api`)  
RDS PostgreSQL (private) · S3 documents · Secrets Manager · CloudWatch

## Prerequisites

- AWS account + IAM permissions for CDK bootstrap
- Domain (optional) for Route 53
- Docker images pushed to ECR

```bash
cd infra
pnpm install
npx cdk bootstrap
npx cdk synth
# npx cdk deploy TelemedicineAiStack   # only in an authorized account
```

## Notes

- Do **not** claim infrastructure is deployed unless `cdk deploy` succeeded in your account.
- SES/email is intentionally unused in this product configuration.
- Cognito is optional; this build uses anonymous sessions instead.
