import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, LogOut } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase";
import { signOut } from "@/lib/actions";
import { hasSupabaseEnv } from "@/lib/env";
import { SetupRequired } from "@/components/setup-required";
import { DevTools } from "@/components/dev-tools";
import { NavigationTabs } from "@/components/navigation-tabs";
import { getDictionary } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { DictionaryKey } from "@/lib/i18n/dictionaries";

const navItems: {
  href: string;
  labelKey: DictionaryKey;
  mobileLabelKey: DictionaryKey;
  icon: "dashboard" | "products" | "customers" | "sales" | "payments";
}[] = [
  {
    href: "/dashboard",
    labelKey: "nav_dashboard",
    mobileLabelKey: "nav_home",
    icon: "dashboard",
  },
  {
    href: "/products",
    labelKey: "nav_products",
    mobileLabelKey: "nav_stock",
    icon: "products",
  },
  {
    href: "/customers",
    labelKey: "nav_customers",
    mobileLabelKey: "nav_clients",
    icon: "customers",
  },
  {
    href: "/sales",
    labelKey: "nav_sales",
    mobileLabelKey: "nav_sales_short",
    icon: "sales",
  },
  {
    href: "/payments",
    labelKey: "nav_payments",
    mobileLabelKey: "nav_payments_short",
    icon: "payments",
  },
];

const quickActions: { href: string; labelKey: DictionaryKey }[] = [
  { href: "/products#add-product", labelKey: "prod_add" },
  { href: "/customers#add-customer", labelKey: "cust_add" },
  { href: "/sales/new", labelKey: "sale_new" },
  { href: "/payments#record-payment", labelKey: "pay_record" },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv()) return <SetupRequired />;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { t } = await getDictionary();
  const desktopNavItems = navItems.map((item) => ({
    ...item,
    label: t(item.labelKey),
    mobileLabel: t(item.mobileLabelKey),
  }));

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-white px-4 py-5 lg:flex">
        <Link
          className="flex items-center gap-3 text-lg font-bold text-ink"
          href="/dashboard"
        >
          <div className="h-10 w-10 overflow-hidden rounded-lg border border-line bg-white shadow-sm">
            <Image
              alt="Wholesale MVP logo"
              className="h-full w-full object-cover"
              height={40}
              src="/logo.svg"
              width={40}
            />
          </div>
          <span>ነጋዴ ERP</span>
        </Link>
        <p className="mt-1 text-xs text-muted">
          Business tools for daily sales
        </p>

        <NavigationTabs items={desktopNavItems} variant="desktop" />

        <div className="mt-8 flex-1 space-y-2">
          <p className="px-3 text-xs font-semibold uppercase tracking-normal text-muted">
            Quick actions
          </p>
          {quickActions.map((action) => (
            <Link
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
              href={action.href}
              key={action.href}
            >
              <Plus className="h-4 w-4" />
              {t(action.labelKey)}
            </Link>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <LanguageSwitcher />

          <form action={signOut} className="w-full">
            <button className="btn-secondary w-full" type="submit">
              <LogOut className="h-4 w-4 shrink-0" />
              {t("nav_logout")}
            </button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex flex-col gap-3 border-b border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link
            className="flex items-center gap-2 text-base font-bold"
            href="/dashboard"
          >
            <div className="h-8 w-8 overflow-hidden rounded-md border border-line bg-white">
              <Image
                alt="Wholesale MVP logo"
                className="h-full w-full object-cover"
                height={32}
                src="/logo.svg"
                width={32}
              />
            </div>
            <span>ነጋዴ ERP</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-20 sm:w-24">
              <LanguageSwitcher />
            </div>
            <Link className="btn-primary h-9 px-2.5 sm:px-3 text-xs sm:text-sm" href="/sales/new">
              <Plus className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline">{t("sale_new")}</span>
            </Link>
            <form action={signOut}>
              <button
                className="btn-secondary h-9 px-2.5 text-xs flex items-center gap-1"
                type="submit"
                title={t("nav_logout")}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{t("nav_logout")}</span>
              </button>
            </form>
          </div>
        </div>
        <NavigationTabs
          items={navItems.map((item) => ({
            ...item,
            label: t(item.labelKey),
            mobileLabel: t(item.mobileLabelKey),
          }))}
          variant="mobile"
        />
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <DevTools />
    </div>
  );
}
