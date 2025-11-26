import { z } from 'zod';
import type { ApiConfig } from './app';

const envSchema = z.object({
  AUTH0_DOMAIN: z.string().optional(),
  AUTH0_AUDIENCE: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  DISABLE_AUTH: z.string().optional(),
  FAL_KEY: z.string().optional(),
  FALAI_API_KEY: z.string().optional(),
});

export function loadApiConfig(env: Record<string, string | undefined>): ApiConfig {
  const parsed = envSchema.parse(env);
  const allowedOrigins = parsed.ALLOWED_ORIGINS
    ? parsed.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [];
  const authConfigured = Boolean(parsed.AUTH0_DOMAIN && parsed.AUTH0_AUDIENCE);

  return {
    auth0Domain: parsed.AUTH0_DOMAIN,
    auth0Audience: parsed.AUTH0_AUDIENCE,
    allowedOrigins,
    authDisabled: !authConfigured || parsed.DISABLE_AUTH === '1' || parsed.DISABLE_AUTH === 'true',
    falKey: parsed.FAL_KEY || parsed.FALAI_API_KEY,
  };
}
