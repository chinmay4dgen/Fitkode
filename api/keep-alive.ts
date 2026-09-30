import type { IncomingMessage, ServerResponse } from 'http';

interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>;
  body: any;
  method?: string;
}

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (data: any) => void;
  send: (data: any) => void;
}

/**
 * Vercel Serverless Function & Cron Job Handler
 * 
 * Periodically invoked by Vercel Cron (defined in vercel.json) or external monitors
 * to execute a lightweight database query (`SELECT 1` equivalent on Supabase REST API)
 * and ping the Auth GoTrue service. This guarantees active usage on the Supabase Free
 * tier and prevents automatic pausing after 7 days of inactivity.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Use GET or HEAD.',
    });
  }

  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://okwqbcmndtrdtnqlijip.supabase.co';

  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(400).json({
      success: false,
      error: 'Supabase credentials not configured in environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // 1. Query public.profiles database table (SELECT id with LIMIT 1)
    const dbRes = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&limit=1`, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    // 2. Query Auth settings to ensure GoTrue instance remains active
    const authRes = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    const isDbOk = dbRes.status >= 200 && dbRes.status < 500;
    const isAuthOk = authRes.status >= 200 && authRes.status < 500;

    return res.status(200).json({
      success: isDbOk,
      timestamp: new Date().toISOString(),
      service: 'Supabase Free Tier Keep-Alive (Vercel Cron)',
      database: {
        status: dbRes.status,
        statusText: dbRes.statusText,
        alive: isDbOk,
      },
      auth: {
        status: authRes.status,
        statusText: authRes.statusText,
        alive: isAuthOk,
      },
      message: isDbOk
        ? 'Supabase database and authentication services pinged successfully. Auto-pause prevented.'
        : 'Warning: Supabase returned unexpected status code. Please check your project dashboard.',
    });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      error: err?.message || 'Failed to ping Supabase instance',
      timestamp: new Date().toISOString(),
    });
  }
}
