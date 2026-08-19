"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { signIn, signUp } from "@/lib/actions";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="panel w-full max-w-sm space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink">{mode === "login" ? "Login" : "Create account"}</h1>
        <p className="mt-1 text-sm text-muted">Manage sales, stock, customers, and payments.</p>
      </div>

      <label className="field">
        Email
        <input className="input" name="email" required type="email" />
      </label>

      <label className="field">
        Password
        <input className="input" minLength={6} name="password" required type="password" />
      </label>

      <FormMessage state={state} />
      <SubmitButton>{mode === "login" ? "Login" : "Create account"}</SubmitButton>

      <p className="text-sm text-muted">
        {mode === "login" ? "No account yet? " : "Already have an account? "}
        <Link className="font-semibold text-brand-700" href={mode === "login" ? "/signup" : "/login"}>
          {mode === "login" ? "Sign up" : "Login"}
        </Link>
      </p>
    </form>
  );
}
