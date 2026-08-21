export function getSupabaseEnv() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!raw || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  try {
    // Ensure we only return the origin (protocol + host + port) so clients
    // don't include extra path segments that break the auth/request URLs.
    const parsed = new URL(raw);
    const url = parsed.origin;
    return { url, anonKey };
  } catch {
    throw new Error(
      "Invalid NEXT_PUBLIC_SUPABASE_URL: must be a full URL, e.g. https://xyz.supabase.co",
    );
  }
}

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
