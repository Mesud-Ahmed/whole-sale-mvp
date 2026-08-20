"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { adjustStock } from "@/lib/actions";
import { useTranslation } from "@/lib/i18n/context";

export function StockAdjustmentForm({ productId }: { productId: string }) {
  const [state, formAction] = useActionState(adjustStock, null);
  const { t } = useTranslation();

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_1.5fr_auto]">
      <input name="product_id" type="hidden" value={productId} />
      <label className="field">
        {t("stock_direction")}
        <select className="input" name="direction">
          <option value="increase">{t("stock_increase")}</option>
          <option value="decrease">{t("stock_decrease")}</option>
        </select>
      </label>
      <label className="field">
        {t("prod_quantity")}
        <input className="input" min="0.01" name="quantity" required step="0.01" type="number" />
      </label>
      <label className="field">
        {t("pay_notes")}
        <input className="input" name="note" placeholder={t("stock_reason_placeholder")} />
      </label>
      <div className="flex items-end">
        <SubmitButton className="btn-secondary w-full">{t("stock_adjust_btn")}</SubmitButton>
      </div>
      <div className="sm:col-span-4">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
