"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveProduct } from "@/lib/actions";

type Product = {
  id?: string;
  name?: string | null;
  sku?: string | null;
  category?: string | null;
  unit?: string | null;
  purchase_price?: number | string | null;
  selling_price?: number | string | null;
  current_quantity?: number | string | null;
  minimum_stock?: number | string | null;
};

export function ProductForm({ product }: { product?: Product }) {
  const [state, formAction] = useActionState(saveProduct, null);
  const editing = Boolean(product?.id);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      {product?.id ? <input name="id" type="hidden" value={product.id} /> : null}

      <label className="field sm:col-span-2">
        Product name
        <input className="input" defaultValue={product?.name ?? ""} name="name" required />
      </label>

      <label className="field">
        SKU
        <input className="input" defaultValue={product?.sku ?? ""} name="sku" />
      </label>

      <label className="field">
        Category
        <input className="input" defaultValue={product?.category ?? ""} name="category" />
      </label>

      <label className="field">
        Unit
        <input className="input" defaultValue={product?.unit ?? "piece"} name="unit" required />
      </label>

      <label className="field">
        Purchase price
        <input className="input" defaultValue={String(product?.purchase_price ?? 0)} min="0" name="purchase_price" required step="0.01" type="number" />
      </label>

      <label className="field">
        Selling price
        <input className="input" defaultValue={String(product?.selling_price ?? 0)} min="0" name="selling_price" required step="0.01" type="number" />
      </label>

      <label className="field">
        {editing ? "Current quantity" : "Initial quantity"}
        <input
          className="input"
          defaultValue={String(product?.current_quantity ?? 0)}
          disabled={editing}
          min="0"
          name="current_quantity"
          required
          step="0.01"
          type="number"
        />
      </label>

      <label className="field">
        Minimum stock
        <input className="input" defaultValue={String(product?.minimum_stock ?? 0)} min="0" name="minimum_stock" required step="0.01" type="number" />
      </label>

      <div className="flex items-center gap-3 sm:col-span-2">
        <SubmitButton>{editing ? "Save Product" : "Add Product"}</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
