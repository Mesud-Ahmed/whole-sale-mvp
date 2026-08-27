import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { createServerSupabaseClient } from "@/lib/supabase";
import { formatDate, formatEtb } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/server";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);
  const { t } = await getDictionary();

  const [
    { data: todaySales },
    { data: debts },
    { data: products },
    { data: recentSales },
  ] = await Promise.all([
    supabase.from("sales").select("id,total_amount").eq("sale_date", today),
    supabase.from("customer_balances").select("outstanding_balance"),
    supabase
      .from("products")
      .select("id,name,unit,current_quantity,minimum_stock")
      .eq("active", true),
    supabase
      .from("sales")
      .select(
        "id,total_amount,payment_status,sale_date,customers(name,business_name)",
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const todayTotal = (todaySales ?? []).reduce(
    (sum, sale) => sum + Number(sale.total_amount),
    0,
  );
  const totalDebt = (debts ?? []).reduce(
    (sum, row) => sum + Number(row.outstanding_balance),
    0,
  );
  const lowStock = (products ?? []).filter(
    (product) =>
      Number(product.current_quantity) <= Number(product.minimum_stock),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t("dash_title")}</h1>
          <p className="text-sm text-muted">{t("dash_subtitle")}</p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={t("dash_today_sales_etb")}
          value={formatEtb(todayTotal)}
          detail={t("dash_today_sales_detail")}
        />
        <StatCard
          label={t("dash_today_sales_count")}
          value={String(todaySales?.length ?? 0)}
          detail={t("dash_sales_count_detail")}
        />
        <StatCard
          label={t("dash_customer_debt")}
          value={formatEtb(totalDebt)}
          detail={t("dash_customer_debt_detail")}
        />
        <StatCard
          label={t("dash_low_stock")}
          value={String(lowStock.length)}
          detail={t("dash_low_stock_detail")}
        />
      </section>

      <section className="panel">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">{t("dash_recent_sales")}</h2>
            <p className="text-xs text-muted">
              {t("dash_recent_sales_subtitle")}
            </p>
          </div>
          <Link className="text-sm font-semibold text-brand-700" href="/sales">
            {t("action_view_all")}
          </Link>
        </div>

        {recentSales?.length ? (
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-paper text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">
                      {t("cust_name")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t("sale_total")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t("sale_status")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t("sale_date")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => {
                    const customer = Array.isArray(sale.customers)
                      ? sale.customers[0]
                      : sale.customers;

                    return (
                      <tr className="border-t border-line" key={sale.id}>
                        <td className="px-4 py-3">
                          <Link
                            className="font-semibold text-brand-700"
                            href={`/sales/${sale.id}`}
                          >
                            {customer?.name ?? t("dash_walk_in")}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {formatEtb(sale.total_amount)}
                        </td>
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
                            {sale.payment_status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {formatDate(sale.sale_date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState title={t("dash_no_sales")} />
        )}
      </section>
    </div>
  );
}
