import { redirect } from "next/navigation";
import { AuthForm } from "@/components/forms/auth-form";
import { createServerSupabaseClient } from "@/lib/supabase";
import { hasSupabaseEnv } from "@/lib/env";
import { SetupRequired } from "@/components/setup-required";

export default async function SignupPage() {
  if (!hasSupabaseEnv()) return <SetupRequired />;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <AuthForm mode="signup" />
    </main>
  );
}
