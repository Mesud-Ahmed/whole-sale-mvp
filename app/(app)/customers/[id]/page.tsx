import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CustomerForm } from "@/components/forms/customer-form";
import { PaymentForm } from "@/components/forms/payment-form";
import { createServerSupabaseClient } from "@/lib/supabase";
import { formatDate, formatEtb } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/server";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { t } = await getDictionary();

  const [
    { data: customer },
    { data: balance },
    { data: sales },
    { data: payments },
    { data: debtCustomers },
    { data: openSales },
    { data: creditRecords },
  ] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).single(),
    supabase
      .from("customer_balances")
      .select("*")
      .eq("customer_id", id)
      .single(),
    supabase
      .from("sales")
      .select("id,sale_date,total_amount,amount_paid,payment_status")
      .eq("customer_id", id)
      .order("sale_date", { ascending: false }),
    supabase
      .from("payments")
      .select("*")
      .eq("customer_id", id)
      .order("payment_date", { ascending: false }),
    supabase
      .from("customer_balances")
      .select("customer_id,name,business_name,outstanding_balance")
      .gt("outstanding_balance", 0),
    supabase
      .from("sale_balances")
      .select("sale_id,customer_id,balance")
      .eq("customer_id", id)
      .gt("balance", 0),
    supabase
      .from("merchant_credits")
      .select("id,amount,credit_date,note")
      .eq("customer_id", id)
      .order("credit_date", { ascending: false }),
  ]);

  if (!customer) notFound();

  const merchantCreditTotal = (creditRecords ?? []).reduce(
    (sum, credit) => sum + Number(credit.amount ?? 0),
    0,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            className="text-sm font-semibold text-brand-700"
            href="/customers"
          >
            {t("action_view_all")}
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-ink">{customer.name}</h1>
          <p className="text-sm text-muted">
            {customer.business_name || "No business name"}
          </p>
          <p className="mt-1 text-sm text-muted">{t("cust_detail_subtitle")}</p>
        </div>
        <Link className="btn-primary" href="/sales/new">
          {t("sale_new")}
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-4">
        <div className="panel">
          <p className="text-sm text-muted">{t("sale_total")}</p>
          <p className="mt-2 text-xl font-bold">
            {formatEtb(balance?.total_purchases)}
          </p>
        </div>
        <div className="panel">
          <p className="text-sm text-muted">{t("sale_amount_paid")}</p>
          <p className="mt-2 text-xl font-bold">
            {formatEtb(balance?.total_paid)}
          </p>
        </div>
        <div className="panel">
          <p className="text-sm text-muted">{t("cust_outstanding")}</p>
          <p className="mt-2 text-xl font-bold text-danger">
            {formatEtb(balance?.outstanding_balance)}
          </p>
        </div>
        <div className="panel">
          <p className="text-sm text-muted">{t("merchant_credit")}</p>
          <p className="mt-2 text-xl font-bold text-brand-700">
            {formatEtb(merchantCreditTotal)}
          </p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="panel">
          <h2 className="mb-4 text-base font-bold">{t("cust_title")}</h2>
          <div className="mb-5 space-y-2 text-sm">
            <p>
              <strong>{t("cust_phone")}: </strong>
              {customer.phone || "-"}
            </p>
            <p>
              <strong>{t("cust_address")}: </strong>
              {customer.address || "-"}
            </p>
          </div>
          <CustomerForm customer={customer} />
        </div>

        <div className="panel">
          <h2 className="mb-4 text-base font-bold">{t("pay_record")}</h2>
          {Number(balance?.outstanding_balance ?? 0) > 0 ? (
            <PaymentForm
              customers={debtCustomers ?? []}
              openSales={openSales ?? []}
              selectedCustomerId={id}
            />
          ) : (
            <p className="text-sm font-medium text-muted">
              {t("dash_no_debt")}
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="panel">
          <h2 className="mb-4 text-base font-bold">{t("dash_recent_sales")}</h2>
          {sales?.length ? (
            <div className="space-y-3">
              {sales.map((sale) => (
                <Link
                  className="grid gap-2 rounded-md border border-line p-3 text-sm sm:grid-cols-4"
                  href={`/sales/${sale.id}`}
                  key={sale.id}
                >
                  <span>{formatDate(sale.sale_date)}</span>
                  <span className="font-semibold">
                    {formatEtb(sale.total_amount)}
                  </span>
                  <span>{formatEtb(sale.amount_paid)}</span>
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
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-muted">
              {t("dash_no_sales")}
            </p>
          )}
        </div>

        <div className="panel">
          <h2 className="mb-4 text-base font-bold">{t("pay_recent")}</h2>
          {payments?.length ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  className="rounded-md border border-line p-3 text-sm"
                  key={payment.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">
                      {formatEtb(payment.amount)}
                    </span>
                    <span className="text-muted">
                      {formatDate(payment.payment_date)}
                    </span>
                  </div>
                  {payment.note ? (
                    <p className="mt-1 text-muted">{payment.note}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-muted">
              {t("pay_no_payments")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
