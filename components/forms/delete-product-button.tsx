"use client";

import { deactivateProduct } from "@/lib/actions";

export function DeleteProductButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  return (
    <form
      action={deactivateProduct}
      onSubmit={(e) => {
        if (!confirm("Are you sure you want to delete this product?")) {
          e.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={id} />
      <button className="btn-danger" type="submit">
        {label}
      </button>
    </form>
  );
}
