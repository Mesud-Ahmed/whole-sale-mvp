"use client";

import { useState } from "react";
import { PencilLine, Plus } from "lucide-react";
import { ProductForm } from "@/components/forms/product-form";
import { SlideOver } from "@/components/ui/slide-over";
import { useTranslation } from "@/lib/i18n/context";

export function ProductDrawer({
  product,
}: {
  product?: {
    id?: string;
    name?: string | null;
    unit?: string | null;
    purchase_price?: number | string | null;
    selling_price?: number | string | null;
    current_quantity?: number | string | null;
    minimum_stock?: number | string | null;
  };
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const isEditing = Boolean(product?.id);

  return (
    <>
      <button
        className={isEditing ? "btn-secondary" : "btn-primary"}
        onClick={() => setOpen(true)}
        type="button"
      >
        {isEditing ? (
          <PencilLine className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {isEditing ? t("action_edit") : t("prod_add")}
      </button>

      <SlideOver
        onClose={() => setOpen(false)}
        open={open}
        subtitle={t("prod_subtitle")}
        title={isEditing ? t("prod_edit") : t("prod_add")}
      >
        <ProductForm product={product} />
      </SlideOver>
    </>
  );
}
