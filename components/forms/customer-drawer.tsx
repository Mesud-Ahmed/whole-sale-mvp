"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CustomerForm } from "@/components/forms/customer-form";
import { SlideOver } from "@/components/ui/slide-over";
import { useTranslation } from "@/lib/i18n/context";

export function CustomerDrawer() {
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
        {t("cust_add")}
      </button>

      <SlideOver
        onClose={() => setOpen(false)}
        open={open}
        subtitle={t("cust_add_subtitle")}
        title={t("cust_add")}
      >
        <CustomerForm />
      </SlideOver>
    </>
  );
}
