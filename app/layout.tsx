import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/lib/i18n/context";
import { Language } from "@/lib/i18n/dictionaries";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wholesale MVP",
  description: "Simple wholesale business management for Ethiopia"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "en") as Language;
  const validLang = ["en", "am"].includes(lang) ? lang : "en";

  return (
    <html lang={validLang}>
      <body>
        <LanguageProvider initialLang={validLang}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
