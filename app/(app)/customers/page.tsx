import Link from "next/link";
import { CustomerDrawer } from "@/components/forms/customer-drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { LiveSearch } from "@/components/ui/live-search";
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
        <div className="mb-4 max-w-md">
          <LiveSearch
            initialValue={params.search ?? ""}
            label={t("cust_search")}
            placeholder={t("cust_search_placeholder")}
          />
        </div>

        {filtered.length ? (
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-paper text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">
                      {t("cust_name")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t("cust_business")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t("cust_phone")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t("cust_outstanding")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer) => (
                    <tr
                      className="border-t border-line transition-colors hover:bg-paper"
                      key={customer.customer_id}
                    >
                      <td className="px-4 py-3">
                        <Link
                          className="font-semibold text-brand-700"
                          href={`/customers/${customer.customer_id}`}
                        >
                          {customer.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {customer.business_name || "-"}
                      </td>
                      <td className="px-4 py-3">{customer.phone || "-"}</td>
                      <td
                        className={`px-4 py-3 font-semibold ${Number(customer.outstanding_balance) > 0 ? "text-danger" : "text-success"}`}
                      >
                        {formatEtb(customer.outstanding_balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState title={t("cust_add_first")} />
        )}
      </section>
    </div>
  );
}
