"use client";

import React, { createContext, useContext, useState } from "react";
import { Language, dictionaries, DictionaryKey } from "./dictionaries";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: DictionaryKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode;
  initialLang?: Language;
}) {
  const [language, setLanguage] = useState<Language>(initialLang);

  // When language changes, update cookie (if not already set) and maybe localStorage
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    document.cookie = `lang=${lang}; path=/; max-age=31536000`;
    // We do NOT call router.refresh() here because the switcher component will handle it,
    // or we can let the context be reactive for client components immediately.
  };

  const t = (key: DictionaryKey): string => {
    return dictionaries[language][key] || dictionaries["en"][key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: handleSetLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
