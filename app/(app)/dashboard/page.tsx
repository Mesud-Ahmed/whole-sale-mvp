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

  const [{ data: todaySales }, { data: debts }, { data: products }, { data: recentSales }, { data: topDebts }] =
    await Promise.all([
      supabase.from("sales").select("id,total_amount").eq("sale_date", today),
      supabase.from("customer_balances").select("outstanding_balance"),
      supabase.from("products").select("id,name,unit,current_quantity,minimum_stock").eq("active", true),
      supabase
        .from("sales")
        .select("id,total_amount,payment_status,sale_date,customers(name,business_name)")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("customer_balances")
        .select("customer_id,name,business_name,outstanding_balance")
        .gt("outstanding_balance", 0)
        .order("outstanding_balance", { ascending: false })
        .limit(5)
    ]);

  const todayTotal = (todaySales ?? []).reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const totalDebt = (debts ?? []).reduce((sum, row) => sum + Number(row.outstanding_balance), 0);
  const lowStock = (products ?? []).filter((product) => Number(product.current_quantity) <= Number(product.minimum_stock));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t("dash_title")}</h1>
          <p className="text-sm text-muted">{t("dash_subtitle")}</p>
        </div>
        <Link className="btn-primary" href="/sales/new">
          {t("sale_new")}
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("dash_today_sales_etb")} value={formatEtb(todayTotal)} />
        <StatCard label={t("dash_today_sales_count")} value={String(todaySales?.length ?? 0)} />
        <StatCard label={t("dash_customer_debt")} value={formatEtb(totalDebt)} />
        <StatCard label={t("dash_low_stock")} value={String(lowStock.length)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="panel xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold">{t("dash_recent_sales")}</h2>
            <Link className="text-sm font-semibold text-brand-700" href="/sales">
              {t("action_view_all")}
            </Link>
          </div>
          {recentSales?.length ? (
            <div className="overflow-hidden rounded-lg border border-line">
              {recentSales.map((sale) => {
                const customer = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers;
                return (
                  <Link className="grid gap-2 border-b border-line p-3 text-sm last:border-b-0 sm:grid-cols-4" href={`/sales/${sale.id}`} key={sale.id}>
                    <span className="font-semibold">{customer?.name ?? t("dash_walk_in")}</span>
                    <span>{formatEtb(sale.total_amount)}</span>
                    <Badge tone={sale.payment_status === "PAID" ? "green" : sale.payment_status === "PARTIAL" ? "amber" : "red"}>
                      {sale.payment_status}
                    </Badge>
                    <span className="text-muted">{formatDate(sale.sale_date)}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState title={t("dash_no_sales")} action={<Link className="btn-primary" href="/sales/new">{t("dash_record_first_sale")}</Link>} />
          )}
        </div>

        <div className="space-y-5">
          <div className="panel">
            <h2 className="mb-4 text-base font-bold">{t("dash_customers_with_debt")}</h2>
            {topDebts?.length ? (
              <div className="space-y-3">
                {topDebts.map((customer) => (
                  <Link className="flex items-center justify-between gap-3 rounded-md border border-line p-3 text-sm" href={`/customers/${customer.customer_id}`} key={customer.customer_id}>
                    <span className="font-semibold">{customer.name}</span>
                    <span>{formatEtb(customer.outstanding_balance)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-muted">{t("dash_no_debt")}</p>
            )}
          </div>

          <div className="panel">
            <h2 className="mb-4 text-base font-bold">{t("dash_low_stock_title")}</h2>
            {lowStock.length ? (
              <div className="space-y-3">
                {lowStock.slice(0, 6).map((product) => (
                  <Link className="block rounded-md border border-amber-200 bg-amber-50 p-3 text-sm" href="/products" key={product.id}>
                    <span className="font-semibold">{product.name}</span>
                    <span className="ml-2 text-amber-800">
                      {product.current_quantity} {product.unit} {t("dash_remaining")}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-muted">{t("dash_all_stock_good")}</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

