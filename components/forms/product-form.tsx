"use client";

import { useActionState, useState } from "react";
import { HelpCircle } from "lucide-react";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveProduct } from "@/lib/actions";
import { useTranslation } from "@/lib/i18n/context";

type Product = {
  id?: string;
  name?: string | null;
  unit?: string | null;
  purchase_price?: number | string | null;
  selling_price?: number | string | null;
  current_quantity?: number | string | null;
  minimum_stock?: number | string | null;
};

function HelpTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 hover:bg-brand-600 hover:text-white focus:outline-none transition-colors"
        title="Click for help"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span className="absolute bottom-full left-0 mb-2 z-50 w-60 rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-100 shadow-xl leading-relaxed">
          {text}
        </span>
      )}
    </span>
  );
}

export function ProductForm({ product }: { product?: Product }) {
  const [state, formAction] = useActionState(saveProduct, null);
  const { t } = useTranslation();
  const editing = Boolean(product?.id);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      {product?.id ? (
        <input name="id" type="hidden" value={product.id} />
      ) : null}

      <label className="field sm:col-span-2">
        {t("prod_name")}
        <input
          className="input"
          defaultValue={product?.name ?? ""}
          name="name"
          required
        />
      </label>

      <label className="field">
        {t("prod_unit")}
        <input
          className="input"
          defaultValue={product?.unit ?? "piece"}
          name="unit"
          required
        />
      </label>

      <label className="field">
        {t("prod_selling_price")}
        <input
          className="input"
          defaultValue={
            product?.selling_price !== undefined &&
            product?.selling_price !== null
              ? String(product.selling_price)
              : ""
          }
          min="0"
          name="selling_price"
          required
          step="0.01"
          type="number"
        />
      </label>

      <label className="field">
        <span className="flex items-center">
          {t("prod_purchase_price")}
          <HelpTooltip text="This is the cost paid to buy the item before it is sold to a customer." />
        </span>
        <input
          className="input"
          defaultValue={
            product?.purchase_price !== undefined &&
            product?.purchase_price !== null
              ? String(product.purchase_price)
              : ""
          }
          min="0"
          name="purchase_price"
          required
          step="0.01"
          type="number"
        />
      </label>

      <label className="field">
        {editing ? t("prod_quantity") : t("prod_initial_qty")}
        <input
          className="input"
          defaultValue={
            product?.current_quantity !== undefined &&
            product?.current_quantity !== null
              ? String(product.current_quantity)
              : ""
          }
          disabled={editing}
          min="0"
          name="current_quantity"
          required
          step="0.01"
          type="number"
        />
      </label>

      <label className="field">
        <span className="flex items-center">
          {t("prod_min_stock")}
          <HelpTooltip text="Keep this low enough to warn you before stock runs out, without over-ordering." />
        </span>
        <input
          className="input"
          defaultValue={
            product?.minimum_stock !== undefined &&
            product?.minimum_stock !== null
              ? String(product.minimum_stock)
              : ""
          }
          min="0"
          name="minimum_stock"
          required
          step="0.01"
          type="number"
        />
      </label>

      <div className="flex items-center gap-3 sm:col-span-2">
        <SubmitButton>{editing ? t("prod_save") : t("prod_add")}</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
