const requiredVariables = [
  'API_PORT',
  'NODE_ENV',
  'DATABASE_URL',
  'CORS_ORIGINS',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN',
  'BCRYPT_SALT_ROUNDS',
] as const;

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

  const bcryptSaltRounds = Number(config.BCRYPT_SALT_ROUNDS);

  if (!Number.isInteger(bcryptSaltRounds) || bcryptSaltRounds < 12) {
    throw new Error('BCRYPT_SALT_ROUNDS must be an integer greater than or equal to 12');
  }

  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
    if (String(config[key]).length < 32) {
      throw new Error(`${key} must be at least 32 characters long`);
    }
  }

  return {
    API_PORT: String(apiPort),
    NODE_ENV: String(config.NODE_ENV),
    DATABASE_URL: String(config.DATABASE_URL),
    CORS_ORIGINS: String(config.CORS_ORIGINS),
    JWT_ACCESS_SECRET: String(config.JWT_ACCESS_SECRET),
    JWT_REFRESH_SECRET: String(config.JWT_REFRESH_SECRET),
    JWT_ACCESS_EXPIRES_IN: String(config.JWT_ACCESS_EXPIRES_IN),
    JWT_REFRESH_EXPIRES_IN: String(config.JWT_REFRESH_EXPIRES_IN),
    BCRYPT_SALT_ROUNDS: String(bcryptSaltRounds),
  };
}
