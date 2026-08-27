"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function LiveSearch({
  initialValue = "",
  label,
  name = "search",
  placeholder,
}: {
  initialValue?: string;
  label: string;
  name?: string;
  placeholder: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleChange = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value.trim()) next.set(name, value.trim());
    else next.delete(name);

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <label className="field">
      {label}
      <span className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          className="input w-full pl-9"
          defaultValue={initialValue}
          onChange={(event) => handleChange(event.target.value)}
          placeholder={placeholder}
        />
      </span>
    </label>
  );
}
