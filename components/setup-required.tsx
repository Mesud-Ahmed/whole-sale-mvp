export function SetupRequired() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <section className="panel max-w-lg space-y-3">
        <h1 className="text-xl font-bold text-ink">Supabase setup required</h1>
        <p className="text-sm text-muted">
          Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`,
          then restart the development server.
        </p>
        <p className="text-sm text-muted">
          Run the SQL migration in `supabase/migrations/001_initial_schema.sql` before using the app.
        </p>
      </section>
    </main>
  );
}
