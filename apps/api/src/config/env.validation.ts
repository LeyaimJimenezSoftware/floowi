const requiredVariables = ['API_PORT', 'NODE_ENV', 'DATABASE_URL', 'CORS_ORIGINS'] as const;

type RequiredEnvironment = {
  [key in (typeof requiredVariables)[number]]: string;
};

export function validateEnvironment(config: Record<string, unknown>): RequiredEnvironment {
  const missing = requiredVariables.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const apiPort = Number(config.API_PORT);

  if (!Number.isInteger(apiPort) || apiPort <= 0) {
    throw new Error('API_PORT must be a positive integer');
  }

  if (!['development', 'staging', 'production', 'test'].includes(String(config.NODE_ENV))) {
    throw new Error('NODE_ENV must be one of: development, staging, production, test');
  }

  return {
    API_PORT: String(apiPort),
    NODE_ENV: String(config.NODE_ENV),
    DATABASE_URL: String(config.DATABASE_URL),
    CORS_ORIGINS: String(config.CORS_ORIGINS),
  };
}
