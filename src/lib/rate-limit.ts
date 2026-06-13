import { createAdminClient } from './supabase'

// Requires this table (run once in Supabase SQL editor):
//   CREATE TABLE IF NOT EXISTS rate_limits (
//     key TEXT NOT NULL,
//     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
//   );
//   CREATE INDEX IF NOT EXISTS rate_limits_key_time_idx ON rate_limits (key, created_at);
//   ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
//
// Without the table, this fails open (allows all requests — same as current in-memory behavior).

export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number = 3_600_000
): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const since = new Date(Date.now() - windowMs).toISOString()

    const { count } = await admin
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('key', key)
      .gte('created_at', since)

    if ((count ?? 0) >= max) return false

    await admin.from('rate_limits').insert({ key })
    return true
  } catch {
    return true // fail open if table doesn't exist yet
  }
}
