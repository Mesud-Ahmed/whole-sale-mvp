"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ProductForm } from "@/components/forms/product-form";
import { SlideOver } from "@/components/ui/slide-over";
import { useTranslation } from "@/lib/i18n/context";

export function ProductDrawer() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="btn-primary"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Plus className="h-4 w-4" />
        {t("prod_add")}
      </button>

      <SlideOver
        onClose={() => setOpen(false)}
        open={open}
        subtitle={t("prod_subtitle")}
        title={t("prod_add")}
      >
        <ProductForm />
      </SlideOver>
    </>
  );
}
