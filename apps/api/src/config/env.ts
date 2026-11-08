export type AppEnv = {
  NODE_ENV: string;
  PORT: number;
  API_PREFIX: string;
  CORS_ORIGINS: string;
  DATABASE_URL: string;
  SESSION_SECRET: string;
  SESSION_COOKIE_NAME: string;
  ADMIN_API_KEY: string;
  AI_PROVIDER: string;
  AVATAR_PROVIDER: string;
  STORAGE_PROVIDER: string;
  LOCAL_STORAGE_PATH: string;
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL: string;
  OPENAI_MODEL: string;
  EMERGENCY_NUMBER: string;
  EMERGENCY_AMBULANCE: string;
  EMERGENCY_REGION: string;
  APP_URL: string;
};

export function validateEnv(raw: NodeJS.ProcessEnv): AppEnv {
  const required = ['DATABASE_URL', 'SESSION_SECRET'] as const;
  for (const key of required) {
    if (!raw[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return {
    NODE_ENV: raw.NODE_ENV ?? 'development',
    PORT: Number(raw.PORT ?? 4000),
    API_PREFIX: raw.API_PREFIX ?? 'api/v1',
    CORS_ORIGINS: raw.CORS_ORIGINS ?? 'http://localhost:3000',
    DATABASE_URL: raw.DATABASE_URL!,
    SESSION_SECRET: raw.SESSION_SECRET!,
    SESSION_COOKIE_NAME: raw.SESSION_COOKIE_NAME ?? 'tmai_session',
    ADMIN_API_KEY: raw.ADMIN_API_KEY ?? 'change-me-admin-key',
    AI_PROVIDER: raw.AI_PROVIDER ?? 'mock',
    AVATAR_PROVIDER: raw.AVATAR_PROVIDER ?? 'mock',
    STORAGE_PROVIDER: raw.STORAGE_PROVIDER ?? 'local',
    LOCAL_STORAGE_PATH: raw.LOCAL_STORAGE_PATH ?? './storage',
    OPENAI_API_KEY: raw.OPENAI_API_KEY,
    OPENAI_BASE_URL: raw.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    OPENAI_MODEL: raw.OPENAI_MODEL ?? 'gpt-4o-mini',
    EMERGENCY_NUMBER: raw.EMERGENCY_NUMBER ?? '112',
    EMERGENCY_AMBULANCE: raw.EMERGENCY_AMBULANCE ?? '108',
    EMERGENCY_REGION: raw.EMERGENCY_REGION ?? 'IN',
    APP_URL: raw.APP_URL ?? 'http://localhost:3000',
  };
}
