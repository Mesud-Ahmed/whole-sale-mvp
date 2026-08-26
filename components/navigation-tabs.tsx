"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Package,
  Users,
  ReceiptText,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

const navIconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  products: Package,
  customers: Users,
  sales: ReceiptText,
  payments: WalletCards,
};

export type NavTabItem = {
  href: string;
  label: string;
  mobileLabel: string;
  icon: keyof typeof navIconMap;
};

export function NavigationTabs({
  items,
  variant = "desktop",
}: {
  items: NavTabItem[];
  variant?: "desktop" | "mobile";
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (pathname === href) return true;
    return pathname.startsWith(`${href}/`);
  };

  if (variant === "mobile") {
    return (
      <nav className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = navIconMap[item.icon] ?? LayoutDashboard;
          const active = isActive(item.href);

          return (
            <Link
              aria-label={item.label}
              className={clsx(
                "flex h-14 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-center transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-500 hover:bg-paper",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon
                className={clsx(
                  "h-5 w-5 transition-colors",
                  active ? "text-brand-700" : "text-slate-500",
                )}
              />
              <span
                className={clsx(
                  "text-[10px] font-semibold leading-none transition-colors",
                  active ? "text-brand-700" : "text-slate-500",
                )}
              >
                {item.mobileLabel}
              </span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="mt-8 flex flex-col gap-1">
      {items.map((item) => {
        const Icon = navIconMap[item.icon] ?? LayoutDashboard;
        const active = isActive(item.href);

        return (
          <Link
            className={clsx(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
              active
                ? "bg-brand-50 text-brand-700"
                : "text-slate-700 hover:bg-paper",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon
              className={clsx(
                "h-4 w-4",
                active ? "text-brand-700" : "text-slate-700",
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
