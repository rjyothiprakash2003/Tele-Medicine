#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TelemedicineAiStack } from '../lib/telemedicine-ai-stack';

const app = new cdk.App();
new TelemedicineAiStack(app, 'TelemedicineAiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'ap-south-1',
  },
  description: 'TELEMEDICINE AI — ECS/RDS/S3 baseline (not deployed unless explicitly authorized)',
});
