"use client";

import { useActionState, useEffect, useState } from "react";
import { DollarSign, ShieldCheck } from "lucide-react";
import { saveMerchantCredit } from "@/lib/actions";
import { FormMessage } from "@/components/ui/form-message";
import { useTranslation } from "@/lib/i18n/context";

const initialState = { ok: false, message: "" };

export function MerchantCreditForm({
  customers,
}: {
  customers: Array<{ id: string; name: string; business_name?: string | null }>;
}) {
  const { t } = useTranslation();
  const [state, formAction, isPending] = useActionState(
    saveMerchantCredit,
    initialState,
  );
  const [selectedCustomer, setSelectedCustomer] = useState<string>(
    customers[0]?.id ?? "",
  );

  useEffect(() => {
    if (customers.length && !selectedCustomer) {
      setSelectedCustomer(customers[0].id);
    }
  }, [customers, selectedCustomer]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4">
        <div className="mb-3 flex items-center gap-2 text-brand-700">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-sm font-semibold">{t("merchant_credit")}</span>
        </div>
        <p className="text-sm text-brand-800/80">{t("merchant_credit_help")}</p>
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-ink"
          htmlFor="credit-customer"
        >
          {t("customer")}
        </label>
        <select
          className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-brand-400"
          defaultValue={selectedCustomer}
          id="credit-customer"
          name="customer_id"
          onChange={(event) => setSelectedCustomer(event.target.value)}
        >
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.business_name || customer.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-ink" htmlFor="credit-amount">
          {t("amount")}
        </label>
        <div className="relative">
          <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-brand-400"
            id="credit-amount"
            min="1"
            name="amount"
            placeholder="0.00"
            step="0.01"
            type="number"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-ink" htmlFor="credit-date">
          {t("date")}
        </label>
        <input
          className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-400"
          defaultValue={new Date().toISOString().slice(0, 10)}
          id="credit-date"
          name="credit_date"
          type="date"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-ink" htmlFor="credit-note">
          {t("note")}
        </label>
        <textarea
          className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-400"
          id="credit-note"
          name="note"
          placeholder={t("merchant_credit_note_placeholder")}
          rows={3}
        />
      </div>

      <button
        className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending || !selectedCustomer}
        type="submit"
      >
        {isPending ? t("saving") : t("save_credit")}
      </button>
      <FormMessage state={state} />
    </form>
  );
}
