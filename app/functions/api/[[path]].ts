import { handle } from 'hono/cloudflare-pages';

type Env = {
  DB: D1Database;
  AUTH0_DOMAIN: string;
  AUTH0_AUDIENCE: string;
  ALLOWED_ORIGINS?: string;
  DISABLE_AUTH?: string;
  DISABLE_API?: string;
};

export const onRequest = handle<Env>(async (c) => {
  // Allow disabling API to ensure Pages deploys even if edge-incompatible deps exist.
  if (c.env.DISABLE_API === '1') {
    return new Response(JSON.stringify({ error: 'API disabled' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const [{ createApiApp }, { loadApiConfig }, { createD1Db }] = await Promise.all([
      import('../../api/app'),
      import('../../api/config'),
      import('../../mastra/db/client.d1'),
    ]);

    const config = loadApiConfig({
      AUTH0_DOMAIN: c.env.AUTH0_DOMAIN,
      AUTH0_AUDIENCE: c.env.AUTH0_AUDIENCE,
      ALLOWED_ORIGINS: c.env.ALLOWED_ORIGINS,
      DISABLE_AUTH: c.env.DISABLE_AUTH,
    });

    const db = createD1Db(c.env.DB);
    const api = createApiApp({ db, config });
    return api.fetch(c.req.raw, c.env, c.executionCtx);
  } catch (err: any) {
    console.error('[api] failed to initialize', err?.message || err);
    return new Response(JSON.stringify({ error: 'API unavailable', detail: err?.message || 'init failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
