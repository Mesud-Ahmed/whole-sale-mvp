import Link from "next/link";
import { Search } from "lucide-react";
import { CustomerForm } from "@/components/forms/customer-form";
import { EmptyState } from "@/components/ui/empty-state";
import { createServerSupabaseClient } from "@/lib/supabase";
import { formatEtb } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/server";

export default async function CustomersPage({
  searchParams
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
        <h2 className="mb-4 text-base font-bold">{t("cust_add")}</h2>
        <CustomerForm />
      </section>

      <section className="panel">
        <form className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]" method="get">
          <label className="field">
            {t("cust_search")}
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input className="input w-full pl-9" defaultValue={params.search ?? ""} name="search" placeholder={t("cust_search_placeholder")} />
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
                <Link className="grid gap-2 p-4 text-sm hover:bg-paper md:grid-cols-4" href={`/customers/${customer.customer_id}`} key={customer.customer_id}>
                  <span className="font-semibold">{customer.name}</span>
                  <span>{customer.business_name || "-"}</span>
                  <span>{customer.phone || "-"}</span>
                  <span className={Number(customer.outstanding_balance) > 0 ? "font-semibold text-danger" : "font-semibold text-success"}>
                    {formatEtb(customer.outstanding_balance)}
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
