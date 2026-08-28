"use client";

import { useActionState } from "react";
import { useState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { recordPayment } from "@/lib/actions";
import { useTranslation } from "@/lib/i18n/context";

type CustomerDebt = {
  customer_id: string;
  name: string | null;
  business_name: string | null;
  outstanding_balance: number | string;
};

type OpenSale = {
  sale_id: string;
  customer_id: string;
  balance: number | string;
};

export function PaymentForm({
  customers,
  openSales,
  selectedCustomerId
}: {
  customers: CustomerDebt[];
  openSales: OpenSale[];
  selectedCustomerId?: string;
}) {
  const [state, formAction] = useActionState(recordPayment, null);
  const { t } = useTranslation();
  const [customerId, setCustomerId] = useState(selectedCustomerId ?? "");
  const today = new Date().toISOString().slice(0, 10);
  const visibleSales = openSales.filter((sale) => !customerId || sale.customer_id === customerId);

  return (
    <form action={formAction} className="grid gap-3 w-full max-w-full min-w-0 sm:grid-cols-2" id="record-payment">
      <label className="field w-full min-w-0">
        {t("sale_customer_filter")}
        <select className="input w-full min-w-0 truncate" name="customer_id" onChange={(event) => setCustomerId(event.target.value)} required value={customerId}>
          <option value="">{t("pay_select_customer")}</option>
          {customers.map((customer) => (
            <option key={customer.customer_id} value={customer.customer_id}>
              {customer.name} ({customer.outstanding_balance} ETB)
            </option>
          ))}
        </select>
      </label>

      <label className="field w-full min-w-0">
        {t("sale_title")}
        <select className="input w-full min-w-0 truncate" name="sale_id">
          <option value="">{t("pay_oldest_first")}</option>
          {visibleSales.map((sale) => (
            <option key={sale.sale_id} value={sale.sale_id}>
              {sale.sale_id.slice(0, 8)} - {sale.balance} ETB
            </option>
          ))}
        </select>
      </label>

      <label className="field w-full min-w-0">
        {t("pay_amount")}
        <input className="input w-full min-w-0" min="0.01" name="amount" required step="0.01" type="number" />
      </label>

      <label className="field w-full min-w-0">
        {t("pay_date")}
        <input className="input w-full min-w-0" defaultValue={today} name="payment_date" required type="date" />
      </label>

      <label className="field w-full min-w-0 sm:col-span-2">
        {t("pay_notes")}
        <textarea className="textarea w-full min-w-0" name="note" placeholder={t("pay_note_placeholder")} />
      </label>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <SubmitButton>{t("pay_record")}</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
