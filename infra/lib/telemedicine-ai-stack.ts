import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

/**
 * Baseline AWS architecture for TELEMEDICINE AI.
 * Deploy only with explicit authorization in a real AWS account.
 */
export class TelemedicineAiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    const docsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'telemedicine' }),
        generateStringKey: 'password',
        excludePunctuation: true,
      },
    });

    const db = new rds.DatabaseInstance(this, 'Postgres', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: 'telemedicine',
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      publiclyAccessible: false,
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    const apiTask = new ecs.FargateTaskDefinition(this, 'ApiTask', {
      memoryLimitMiB: 1024,
      cpu: 512,
    });
    docsBucket.grantReadWrite(apiTask.taskRole);
    dbSecret.grantRead(apiTask.taskRole);

    apiTask.addContainer('api', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/node:22-alpine'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'tmai-api',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      environment: {
        NODE_ENV: 'production',
        AI_PROVIDER: 'mock',
        ENABLE_EMAIL: 'false',
        S3_BUCKET: docsBucket.bucketName,
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(dbSecret),
      },
      portMappings: [{ containerPort: 4000 }],
    });

    const webTask = new ecs.FargateTaskDefinition(this, 'WebTask', {
      memoryLimitMiB: 512,
      cpu: 256,
    });
    webTask.addContainer('web', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/node:22-alpine'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'tmai-web',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      portMappings: [{ containerPort: 3000 }],
    });

    const apiService = new ecs.FargateService(this, 'ApiService', {
      cluster,
      taskDefinition: apiTask,
      desiredCount: 1,
      assignPublicIp: false,
    });

    const webService = new ecs.FargateService(this, 'WebService', {
      cluster,
      taskDefinition: webTask,
      desiredCount: 1,
      assignPublicIp: false,
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc,
      internetFacing: true,
    });

    const listener = alb.addListener('Http', { port: 80, open: true });
    listener.addTargets('WebTargets', {
      port: 3000,
      targets: [webService],
      healthCheck: { path: '/' },
    });
    listener.addTargets('ApiTargets', {
      priority: 10,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api/*', '/docs*'])],
      port: 4000,
      targets: [apiService],
      healthCheck: { path: '/api/v1/health' },
    });

    db.connections.allowDefaultPortFrom(apiService.connections);

    new cdk.CfnOutput(this, 'AlbDns', { value: alb.loadBalancerDnsName });
    new cdk.CfnOutput(this, 'DocumentsBucketName', { value: docsBucket.bucketName });
  }
}
