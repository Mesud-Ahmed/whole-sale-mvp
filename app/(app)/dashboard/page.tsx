import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
    { data: topDebts },
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
    supabase
      .from("customer_balances")
      .select("customer_id,name,business_name,outstanding_balance")
      .gt("outstanding_balance", 0)
      .order("outstanding_balance", { ascending: false })
      .limit(5),
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
        <Link className="btn-primary" href="/sales/new">
          {t("sale_new")}
        </Link>
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

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="panel xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">{t("dash_recent_sales")}</h2>
              <p className="text-xs text-muted">
                {t("dash_recent_sales_subtitle")}
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700"
              href="/sales"
            >
              {t("action_view_all")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {recentSales?.length ? (
            <div className="overflow-hidden rounded-lg border border-line">
              {recentSales.map((sale) => {
                const customer = Array.isArray(sale.customers)
                  ? sale.customers[0]
                  : sale.customers;
                return (
                  <Link
                    className="group grid gap-2 border-b border-line p-3 text-sm last:border-b-0 sm:grid-cols-[1.5fr_1fr_auto_1fr_auto]"
                    href={`/sales/${sale.id}`}
                    key={sale.id}
                  >
                    <span className="flex items-center justify-between gap-3 sm:block">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:hidden">
                        {t("cust_name")}
                      </span>
                      <span className="font-semibold">
                        {customer?.name ?? t("dash_walk_in")}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-3 sm:block">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:hidden">
                        {t("sale_total")}
                      </span>
                      <span>{formatEtb(sale.total_amount)}</span>
                    </span>
                    <span className="flex items-center justify-between gap-3 sm:block">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:hidden">
                        {t("sale_status")}
                      </span>
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
                    </span>
                    <span className="flex items-center justify-between gap-3 sm:block">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:hidden">
                        {t("sale_date")}
                      </span>
                      <span className="text-muted">
                        {formatDate(sale.sale_date)}
                      </span>
                    </span>
                    <span className="inline-flex items-center justify-end gap-1 text-xs font-semibold text-brand-700">
                      {t("sale_view_details")}
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={t("dash_no_sales")}
              action={
                <Link className="btn-primary" href="/sales/new">
                  {t("dash_record_first_sale")}
                </Link>
              }
            />
          )}
        </div>

        <div className="space-y-5">
          <div className="panel">
            <div className="mb-4">
              <h2 className="text-base font-bold">
                {t("dash_customers_with_debt")}
              </h2>
              <p className="text-xs text-muted">
                {t("dash_customers_with_debt_subtitle")}
              </p>
            </div>
            {topDebts?.length ? (
              <div className="space-y-3">
                {topDebts.map((customer) => (
                  <Link
                    className="group flex items-center justify-between gap-3 rounded-md border border-line p-3 text-sm transition-colors hover:bg-paper"
                    href={`/customers/${customer.customer_id}`}
                    key={customer.customer_id}
                  >
                    <span className="flex items-center justify-between gap-3 sm:block">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:hidden">
                        {t("cust_name")}
                      </span>
                      <span className="font-semibold">{customer.name}</span>
                    </span>
                    <span className="flex items-center gap-2 text-right">
                      <span className="flex items-center justify-between gap-3 sm:block">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:hidden">
                          {t("cust_debt")}
                        </span>
                        <span>{formatEtb(customer.outstanding_balance)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                        {t("sale_view_details")}
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-muted">
                {t("dash_no_debt")}
              </p>
            )}
          </div>

          <div className="panel">
            <div className="mb-4">
              <h2 className="text-base font-bold">
                {t("dash_low_stock_title")}
              </h2>
              <p className="text-xs text-muted">
                {t("dash_low_stock_subtitle")}
              </p>
            </div>
            {lowStock.length ? (
              <div className="space-y-3">
                {lowStock.slice(0, 6).map((product) => (
                  <Link
                    className="group flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm"
                    href="/products"
                    key={product.id}
                  >
                    <span>
                      <span className="font-semibold">{product.name}</span>
                      <span className="ml-2 text-amber-800">
                        {product.current_quantity} {product.unit}{" "}
                        {t("dash_remaining")}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                      {t("sale_view_details")}
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-muted">
                {t("dash_all_stock_good")}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
