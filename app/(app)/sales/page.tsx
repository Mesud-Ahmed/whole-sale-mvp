import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
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

  let query = supabase
    .from("sales")
    .select(
      "id,sale_date,total_amount,amount_paid,payment_status,customers(name,business_name)",
    )
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (params.status) query = query.eq("payment_status", params.status);
  if (params.from) query = query.gte("sale_date", params.from);
  if (params.to) query = query.lte("sale_date", params.to);

  const { data: sales } = await query;
  const search = (params.customer ?? "").toLowerCase();
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t("sale_title")}</h1>
          <p className="text-sm text-muted">{t("sale_subtitle")}</p>
        </div>
        <Link className="btn-primary" href="/sales/new">
          {t("sale_new")}
        </Link>
      </div>

      <div className="panel">
        <p className="text-sm text-muted">{t("sale_add_subtitle")}</p>
      </div>

      <section className="panel">
        <form
          className="mb-4 grid gap-3 lg:grid-cols-[1fr_160px_160px_160px_auto]"
          method="get"
        >
          <label className="field">
            {t("sale_customer_filter")}
            <input
              className="input"
              defaultValue={params.customer ?? ""}
              name="customer"
              placeholder={t("sale_customer_placeholder")}
            />
          </label>
          <label className="field">
            {t("sale_from")}
            <input
              className="input"
              defaultValue={params.from ?? ""}
              name="from"
              type="date"
            />
          </label>
          <label className="field">
            {t("sale_to")}
            <input
              className="input"
              defaultValue={params.to ?? ""}
              name="to"
              type="date"
            />
          </label>
          <label className="field">
            {t("sale_status")}
            <select
              className="input"
              defaultValue={params.status ?? ""}
              name="status"
            >
              <option value="">{t("sale_all")}</option>
              <option value="PAID">{t("sale_paid")}</option>
              <option value="PARTIAL">{t("sale_partial")}</option>
              <option value="CREDIT">{t("sale_credit")}</option>
            </select>
          </label>
          <div className="flex items-end">
            <button className="btn-secondary w-full" type="submit">
              {t("action_filter")}
            </button>
          </div>
        </form>

        {filtered.length ? (
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="hidden table-head grid-cols-6 px-4 py-3 lg:grid">
              <span>{t("sale_id")}</span>
              <span>{t("sale_date")}</span>
              <span>{t("sale_customer_filter")}</span>
              <span>{t("sale_total")}</span>
              <span>{t("sale_remaining")}</span>
              <span>{t("sale_status")}</span>
            </div>
            <div className="divide-y divide-line">
              {filtered.map((sale) => {
                const customer = Array.isArray(sale.customers)
                  ? sale.customers[0]
                  : sale.customers;
                const remaining = Math.max(
                  Number(sale.total_amount) - Number(sale.amount_paid),
                  0,
                );

                const statusKey =
                  sale.payment_status === "PAID"
                    ? "sale_paid"
                    : sale.payment_status === "PARTIAL"
                      ? "sale_partial"
                      : "sale_credit";

                return (
                  <Link
                    className="group grid gap-2 p-4 text-sm hover:bg-paper lg:grid-cols-[0.8fr_1fr_1.2fr_1fr_1fr_auto]"
                    href={`/sales/${sale.id}`}
                    key={sale.id}
                  >
                    <span className="flex items-center justify-between gap-3 lg:block">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted lg:hidden">
                        {t("sale_id")}
                      </span>
                      <span className="font-mono text-xs">
                        {sale.id.slice(0, 8)}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-3 lg:block">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted lg:hidden">
                        {t("sale_date")}
                      </span>
                      <span>{formatDate(sale.sale_date)}</span>
                    </span>
                    <span className="flex items-center justify-between gap-3 lg:block">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted lg:hidden">
                        {t("sale_customer_filter")}
                      </span>
                      <span className="font-semibold">
                        {customer?.name ?? t("dash_walk_in")}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-3 lg:block">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted lg:hidden">
                        {t("sale_total")}
                      </span>
                      <span>{formatEtb(sale.total_amount)}</span>
                    </span>
                    <span className="flex items-center justify-between gap-3 lg:block">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted lg:hidden">
                        {t("sale_remaining")}
                      </span>
                      <span>{formatEtb(remaining)}</span>
                    </span>
                    <span className="flex items-center justify-end gap-2">
                      <span className="flex items-center justify-between gap-3 lg:block">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted lg:hidden">
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
                          {t(statusKey)}
                        </Badge>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                        {t("sale_view_details")}
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            title={t("sale_no_sales")}
            action={
              <Link className="btn-primary" href="/sales/new">
                {t("dash_record_first_sale")}
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
