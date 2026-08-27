import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LiveSearch } from "@/components/ui/live-search";
import { createServerSupabaseClient } from "@/lib/supabase";
import { formatDate, formatEtb } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/server";

export default async function SalesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const supabase = await createServerSupabaseClient();
  const { t } = await getDictionary();

  const search = (params.customer ?? "").toLowerCase();
  const { data: sales } = await supabase
    .from("sales")
    .select(
      "id,sale_date,total_amount,amount_paid,payment_status,customers(name,business_name)",
    )
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false });

  const filtered = (sales ?? []).filter((sale) => {
    const customer = Array.isArray(sale.customers)
      ? sale.customers[0]
      : sale.customers;
    if (!search) return true;
    return (
      (customer?.name ?? "").toLowerCase().includes(search) ||
      (customer?.business_name ?? "").toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("sale_title")}</h1>
        <p className="text-sm text-muted">{t("sale_subtitle")}</p>
      </div>

      <section className="panel">
        <div className="mb-4 max-w-md">
          <LiveSearch
            initialValue={params.customer ?? ""}
            label={t("sale_customer_filter")}
            name="customer"
            placeholder={t("sale_customer_placeholder")}
          />
        </div>

        {filtered.length ? (
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-paper text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{t("sale_id")}</th>
                    <th className="px-4 py-3 font-semibold">
                      {t("sale_date")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t("sale_customer_filter")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t("sale_total")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t("sale_remaining")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t("sale_status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sale) => {
                    const customer = Array.isArray(sale.customers)
                      ? sale.customers[0]
                      : sale.customers;
                    const remaining = Math.max(
                      Number(sale.total_amount) - Number(sale.amount_paid),
                      0,
                    );

                    return (
                      <tr className="border-t border-line" key={sale.id}>
                        <td className="px-4 py-3">
                          <Link
                            className="font-mono text-xs text-brand-700"
                            href={`/sales/${sale.id}`}
                          >
                            {sale.id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(sale.sale_date)}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {customer?.name ?? t("dash_walk_in")}
                        </td>
                        <td className="px-4 py-3">
                          {formatEtb(sale.total_amount)}
                        </td>
                        <td className="px-4 py-3">{formatEtb(remaining)}</td>
                        <td className="px-4 py-3">
                          <Badge
                            tone={
                              sale.payment_status === "PAID"
                                ? "green"
                                : sale.payment_status === "PARTIAL"
                                  ? "amber"
                                  : "red"
                            }
                          >
                            {sale.payment_status === "PAID"
                              ? t("sale_paid")
                              : sale.payment_status === "PARTIAL"
                                ? t("sale_partial")
                                : t("sale_credit")}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState title={t("sale_no_sales")} />
        )}
      </section>
    </div>
  );
}
