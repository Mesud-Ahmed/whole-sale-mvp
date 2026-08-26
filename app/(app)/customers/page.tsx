import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { CustomerDrawer } from "@/components/forms/customer-drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { createServerSupabaseClient } from "@/lib/supabase";
import { formatEtb } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/server";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const search = (params.search ?? "").toLowerCase();
  const supabase = await createServerSupabaseClient();
  const { t } = await getDictionary();

  const { data: customers } = await supabase
    .from("customer_balances")
    .select("*")
    .order("name", { ascending: true });

  const filtered = (customers ?? []).filter((customer) => {
    if (!search) return true;
    return (
      (customer.name ?? "").toLowerCase().includes(search) ||
      (customer.business_name ?? "").toLowerCase().includes(search) ||
      (customer.phone ?? "").toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("cust_title")}</h1>
        <p className="text-sm text-muted">{t("cust_subtitle")}</p>
      </div>

      <section className="panel" id="add-customer">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">{t("cust_add")}</h2>
            <p className="text-xs text-muted">{t("cust_add_subtitle")}</p>
          </div>
          <CustomerDrawer />
        </div>
      </section>

      <section className="panel">
        <form className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]" method="get">
          <label className="field">
            {t("cust_search")}
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                className="input w-full pl-9"
                defaultValue={params.search ?? ""}
                name="search"
                placeholder={t("cust_search_placeholder")}
              />
            </span>
          </label>
          <div className="flex items-end">
            <button className="btn-secondary w-full" type="submit">
              {t("cust_search")}
            </button>
          </div>
        </form>

        {filtered.length ? (
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="hidden table-head grid-cols-4 px-4 py-3 md:grid">
              <span>{t("cust_name")}</span>
              <span>{t("cust_business")}</span>
              <span>{t("cust_phone")}</span>
              <span>{t("cust_outstanding")}</span>
            </div>
            <div className="divide-y divide-line">
              {filtered.map((customer) => (
                <Link
                  className="group grid gap-2 p-4 text-sm hover:bg-paper md:grid-cols-[1.2fr_1.2fr_1fr_1fr_auto]"
                  href={`/customers/${customer.customer_id}`}
                  key={customer.customer_id}
                >
                  <span className="flex items-center justify-between gap-3 md:block">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted md:hidden">
                      {t("cust_name")}
                    </span>
                    <span className="font-semibold">{customer.name}</span>
                  </span>
                  <span className="flex items-center justify-between gap-3 md:block">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted md:hidden">
                      {t("cust_business")}
                    </span>
                    <span>{customer.business_name || "-"}</span>
                  </span>
                  <span className="flex items-center justify-between gap-3 md:block">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted md:hidden">
                      {t("cust_phone")}
                    </span>
                    <span>{customer.phone || "-"}</span>
                  </span>
                  <span
                    className={
                      Number(customer.outstanding_balance) > 0
                        ? "flex items-center justify-between gap-3 font-semibold text-danger md:block"
                        : "flex items-center justify-between gap-3 font-semibold text-success md:block"
                    }
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted md:hidden">
                      {t("cust_debt")}
                    </span>
                    <span>{formatEtb(customer.outstanding_balance)}</span>
                  </span>
                  <span className="inline-flex items-center justify-end gap-1 text-xs font-semibold text-brand-700">
                    {t("cust_view_details")}
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title={t("cust_add_first")} />
        )}
      </section>
    </div>
  );
}
