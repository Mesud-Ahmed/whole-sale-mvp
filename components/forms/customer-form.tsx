"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveCustomer } from "@/lib/actions";
import { useTranslation } from "@/lib/i18n/context";

type Customer = {
  id?: string;
  name?: string | null;
  phone?: string | null;
  business_name?: string | null;
  address?: string | null;
};

export function CustomerForm({ customer }: { customer?: Customer }) {
  const [state, formAction] = useActionState(saveCustomer, null);
  const { t } = useTranslation();
  const editing = Boolean(customer?.id);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      {customer?.id ? <input name="id" type="hidden" value={customer.id} /> : null}

      <label className="field">
        {t("cust_name")}
        <input className="input" defaultValue={customer?.name ?? ""} name="name" required />
      </label>

      <label className="field">
        {t("cust_phone")}
        <input className="input" defaultValue={customer?.phone ?? ""} name="phone" />
      </label>

      <label className="field">
        {t("cust_business")}
        <input className="input" defaultValue={customer?.business_name ?? ""} name="business_name" />
      </label>

      <label className="field">
        {t("cust_address")}
        <input className="input" defaultValue={customer?.address ?? ""} name="address" />
      </label>

      <div className="flex items-center gap-3 sm:col-span-2">
        <SubmitButton>{editing ? t("cust_save") : t("cust_add")}</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
