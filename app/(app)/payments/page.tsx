import Link from "next/link";
import { MerchantCreditForm } from "@/components/forms/merchant-credit-form";
import { PaymentForm } from "@/components/forms/payment-form";
import { EmptyState } from "@/components/ui/empty-state";
import { createServerSupabaseClient } from "@/lib/supabase";
import { formatDate, formatEtb } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/server";

export default async function PaymentsPage() {
  const supabase = await createServerSupabaseClient();
  const { t } = await getDictionary();
  const [
    { data: debts },
    { data: openSales },
    { data: recentPayments },
    { data: customers },
    { data: recentCredits },
  ] = await Promise.all([
    supabase
      .from("customer_balances")
      .select(
        "customer_id,name,business_name,phone,outstanding_balance,last_payment_date",
      )
      .gt("outstanding_balance", 0)
      .order("outstanding_balance", { ascending: false }),
    supabase
      .from("sale_balances")
      .select("sale_id,customer_id,balance")
      .gt("balance", 0),
    supabase
      .from("payments")
      .select("id,amount,payment_date,note,customers(name,business_name)")
      .order("payment_date", { ascending: false })
      .limit(8),
    supabase
      .from("customers")
      .select("id,name,business_name")
      .order("name", { ascending: true }),
    supabase
      .from("merchant_credits")
      .select("id,amount,credit_date,note,customers(name,business_name)")
      .order("credit_date", { ascending: false })
      .limit(8),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("pay_title")}</h1>
        <p className="text-sm text-muted">{t("pay_subtitle")}</p>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="panel">
          <h2 className="mb-4 text-base font-bold">{t("pay_customers_owe")}</h2>
          {debts?.length ? (
            <div className="space-y-3">
              {debts.map((customer) => (
                <Link
                  className="grid gap-2 rounded-md border border-line p-4 text-sm hover:bg-paper sm:grid-cols-4"
                  href={`/customers/${customer.customer_id}`}
                  key={customer.customer_id}
                >
                  <span className="font-semibold">{customer.name}</span>
                  <span>{customer.business_name || "-"}</span>
                  <span>{formatEtb(customer.outstanding_balance)}</span>
                  <span className="text-muted">
                    {t("pay_last_paid")}{" "}
                    {formatDate(customer.last_payment_date)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title={t("dash_no_debt")} />
          )}
        </div>

        <div className="panel h-fit">
          <h2 className="mb-4 text-base font-bold">{t("pay_record")}</h2>
          {debts?.length ? (
            <PaymentForm customers={debts} openSales={openSales ?? []} />
          ) : (
            <p className="text-sm font-medium text-muted">
              {t("dash_no_debt")}
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="panel h-fit">
          <h2 className="mb-4 text-base font-bold">{t("merchant_credit")}</h2>
          {customers?.length ? (
            <MerchantCreditForm customers={customers} />
          ) : (
            <p className="text-sm font-medium text-muted">
              {t("cust_no_customers")}
            </p>
          )}
        </div>

        <div className="panel">
          <h2 className="mb-4 text-base font-bold">{t("pay_recent")}</h2>
          {recentPayments?.length ? (
            <div className="overflow-hidden rounded-lg border border-line">
              <div className="divide-y divide-line">
                {recentPayments.map((payment) => {
                  const customer = Array.isArray(payment.customers)
                    ? payment.customers[0]
                    : payment.customers;
                  return (
                    <div
                      className="grid gap-2 p-4 text-sm sm:grid-cols-4"
                      key={payment.id}
                    >
                      <span className="font-semibold">
                        {customer?.name ?? t("sale_customer_filter")}
                      </span>
                      <span>{formatEtb(payment.amount)}</span>
                      <span>{formatDate(payment.payment_date)}</span>
                      <span className="text-muted">{payment.note || "-"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium text-muted">
              {t("pay_no_payments")}
            </p>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="mb-4 text-base font-bold">
          {t("merchant_credits_recent")}
        </h2>
        {recentCredits?.length ? (
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="divide-y divide-line">
              {recentCredits.map((credit) => {
                const customer = Array.isArray(credit.customers)
                  ? credit.customers[0]
                  : credit.customers;
                return (
                  <div
                    className="grid gap-2 p-4 text-sm sm:grid-cols-4"
                    key={credit.id}
                  >
                    <span className="font-semibold">
                      {customer?.name ?? t("sale_customer_filter")}
                    </span>
                    <span>{formatEtb(credit.amount)}</span>
                    <span>{formatDate(credit.credit_date)}</span>
                    <span className="text-muted">{credit.note || "-"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium text-muted">
            {t("merchant_credit_none")}
          </p>
        )}
      </section>
    </div>
  );
}
