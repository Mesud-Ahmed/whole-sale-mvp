"use client";

import { useTranslation } from "@/lib/i18n/context";
import { Language } from "@/lib/i18n/dictionaries";
import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const nextLang: Language = language === "en" ? "am" : "en";
    setLanguage(nextLang);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={isPending}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:opacity-50"
    >
      <Globe className="h-4 w-4 shrink-0" />
      <span>{language === "en" ? "አማርኛ" : "English"}</span>
    </button>
  );
}
