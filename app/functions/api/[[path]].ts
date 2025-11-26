type Env = {
  DB: D1Database;
  AUTH0_DOMAIN?: string;
  AUTH0_AUDIENCE?: string;
  ALLOWED_ORIGINS?: string;
  DISABLE_AUTH?: string;
  DISABLE_API?: string;
  FAL_KEY?: string;
  FALAI_API_KEY?: string;
};

export const onRequest = async (context: any) => {
  if (context.env.DISABLE_API === '1') {
    return new Response(JSON.stringify({ error: 'API disabled' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const [{ createApiApp }, { loadApiConfig }, { createD1Db }] = await Promise.all([
      import('../../api/app'),
      import('../../api/config'),
      import('../../mastra/db/client.d1'),
    ]);

    const config = loadApiConfig({
      AUTH0_DOMAIN: context.env.AUTH0_DOMAIN,
      AUTH0_AUDIENCE: context.env.AUTH0_AUDIENCE,
      ALLOWED_ORIGINS: context.env.ALLOWED_ORIGINS,
      DISABLE_AUTH: context.env.DISABLE_AUTH,
      FAL_KEY: context.env.FAL_KEY as any,
      FALAI_API_KEY: context.env.FALAI_API_KEY as any,
    });

    const db = createD1Db(context.env.DB);
    const api = createApiApp({ db, config });
    return api.fetch(context.request, context.env as any, context);
  } catch (err: any) {
    console.error('[api] failed to initialize', err?.message || err);
    return new Response(JSON.stringify({ error: 'API unavailable', detail: err?.message || 'init failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
