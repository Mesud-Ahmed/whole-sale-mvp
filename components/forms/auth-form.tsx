"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { signIn, signUp } from "@/lib/actions";
import { useTranslation } from "@/lib/i18n/context";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction] = useActionState(action, null);
  const { t } = useTranslation();

  return (
    <form action={formAction} className="panel w-full max-w-sm space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink">{mode === "login" ? t("auth_login") : t("auth_create_account")}</h1>
        <p className="mt-1 text-sm text-muted">{t("auth_subtitle")}</p>
      </div>

      <label className="field">
        {t("auth_email")}
        <input className="input" name="email" required type="email" />
      </label>

      <label className="field">
        {t("auth_password")}
        <input className="input" minLength={6} name="password" required type="password" />
      </label>

      <FormMessage state={state} />
      <SubmitButton>{mode === "login" ? t("auth_login") : t("auth_create_account")}</SubmitButton>

      <p className="text-sm text-muted">
        {mode === "login" ? `${t("auth_no_account")} ` : `${t("auth_have_account")} `}
        <Link className="font-semibold text-brand-700" href={mode === "login" ? "/signup" : "/login"}>
          {mode === "login" ? t("auth_signup") : t("auth_login")}
        </Link>
      </p>
    </form>
  );
}
