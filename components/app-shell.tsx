import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Package, Users, ReceiptText, WalletCards, Plus, LogOut } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase";
import { signOut } from "@/lib/actions";
import { hasSupabaseEnv } from "@/lib/env";
import { SetupRequired } from "@/components/setup-required";
import { DevTools } from "@/components/dev-tools";


const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/sales", label: "Sales", icon: ReceiptText },
  { href: "/payments", label: "Payments", icon: WalletCards }
];

const quickActions = [
  { href: "/products#add-product", label: "Add Product" },
  { href: "/customers#add-customer", label: "Add Customer" },
  { href: "/sales/new", label: "New Sale" },
  { href: "/payments#record-payment", label: "Record Payment" }
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv()) return <SetupRequired />;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white px-4 py-5 lg:block">
        <Link className="block text-lg font-bold text-ink" href="/dashboard">
          Wholesale MVP
        </Link>
        <p className="mt-1 text-xs text-muted">Business tools for daily sales</p>

        <nav className="mt-8 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-paper"
                href={item.href}
                key={item.href}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 space-y-2">
          <p className="px-3 text-xs font-semibold uppercase tracking-normal text-muted">Quick actions</p>
          {quickActions.map((action) => (
            <Link
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
              href={action.href}
              key={action.href}
            >
              <Plus className="h-4 w-4" />
              {action.label}
            </Link>
          ))}
        </div>

        <form action={signOut} className="absolute bottom-5 left-4 right-4">
          <button className="btn-secondary w-full" type="submit">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </aside>

      <header className="sticky top-0 z-20 border-b border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link className="text-base font-bold" href="/dashboard">
            Wholesale MVP
          </Link>
          <Link className="btn-primary h-9 px-3" href="/sales/new">
            <Plus className="h-4 w-4" />
            Sale
          </Link>
        </div>
        <nav className="mt-3 grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                aria-label={item.label}
                className="flex h-10 items-center justify-center rounded-md text-slate-700 hover:bg-paper"
                href={item.href}
                key={item.href}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </main>
      <DevTools />
    </div>
  );
}
