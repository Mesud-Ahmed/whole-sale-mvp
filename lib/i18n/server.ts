import { cookies } from "next/headers";
import { Language, dictionaries, DictionaryKey } from "./dictionaries";

export async function getDictionary() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "en") as Language;
  
  // Ensure the cookie value is a valid language
  const validLang = ["en", "am"].includes(lang) ? lang : "en";
  const dictionary = dictionaries[validLang as Language];

  const t = (key: DictionaryKey): string => {
    return dictionary[key] || dictionaries["en"][key] || key;
  };

  return { t, lang: validLang as Language };
}
