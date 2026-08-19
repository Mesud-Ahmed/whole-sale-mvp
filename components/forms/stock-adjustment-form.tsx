"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { adjustStock } from "@/lib/actions";

export function StockAdjustmentForm({ productId }: { productId: string }) {
  const [state, formAction] = useActionState(adjustStock, null);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_1.5fr_auto]">
      <input name="product_id" type="hidden" value={productId} />
      <label className="field">
        Direction
        <select className="input" name="direction">
          <option value="increase">Increase</option>
          <option value="decrease">Decrease</option>
        </select>
      </label>
      <label className="field">
        Quantity
        <input className="input" min="0.01" name="quantity" required step="0.01" type="number" />
      </label>
      <label className="field">
        Note
        <input className="input" name="note" placeholder="Optional reason" />
      </label>
      <div className="flex items-end">
        <SubmitButton className="btn-secondary w-full">Adjust</SubmitButton>
      </div>
      <div className="sm:col-span-4">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
