"use client";

import { useMemo, useState, useActionState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { completeSale } from "@/lib/actions";
import { formatEtb, paymentStatus } from "@/lib/utils";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/context";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  selling_price: number | string;
  current_quantity: number | string;
};

type Customer = {
  id: string;
  name: string;
  business_name: string | null;
};

type SaleItem = {
  product_id: string;
  name: string;
  unit: string;
  available: number;
  quantity: number;
  unit_price: number;
};

export function SaleBuilder({
  products,
  customers,
}: {
  products: Product[];
  customers: Customer[];
}) {
  const { t } = useTranslation();
  const [state, formAction] = useActionState(completeSale, null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [productId, setProductId] = useState("");
  const [query, setQuery] = useState("");
  const [discount, setDiscount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const cleanNumberInput = (val: string) => {
    if (val === "") return "";
    if (/^0\d+/.test(val)) {
      return val.replace(/^0+/, "");
    }
    return val;
  };

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products.slice(0, 25);
    return products
      .filter((product) => {
        return (
          product.name.toLowerCase().includes(term) ||
          (product.sku ?? "").toLowerCase().includes(term)
        );
      })
      .slice(0, 25);
  }, [products, query]);

  const discountNum = Number(discount || 0);
  const amountPaidNum = Number(amountPaid || 0);

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );
  const total = Math.max(subtotal - discountNum, 0);
  const remaining = Math.max(total - amountPaidNum, 0);
  const status = paymentStatus(total, Math.min(amountPaidNum, total));
  const payload = items.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));

  function addProduct() {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product) return;

    const existing = items.find((item) => item.product_id === product.id);
    const available = Number(product.current_quantity);

    if (existing) {
      setItems((current) =>
        current.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.available) }
            : item,
        ),
      );
    } else {
      setItems((current) => [
        ...current,
        {
          product_id: product.id,
          name: product.name,
          unit: product.unit,
          available,
          quantity: available > 0 ? 1 : 0,
          unit_price: Number(product.selling_price),
        },
      ]);
    }

    setProductId("");
    setQuery("");
  }

  function updateItem(productIdToUpdate: string, changes: Partial<SaleItem>) {
    setItems((current) =>
      current.map((item) =>
        item.product_id === productIdToUpdate
          ? {
              ...item,
              ...changes,
              quantity: Math.max(
                0,
                Math.min(changes.quantity ?? item.quantity, item.available),
              ),
            }
          : item,
      ),
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="panel space-y-4">
        <div>
          <h1 className="text-xl font-bold text-ink">{t("sale_new")}</h1>
          <p className="mt-1 text-sm text-muted">{t("sale_subtitle_new")}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="field">
            {t("sale_search_product")}
            <input
              className="input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("sale_search_placeholder")}
              value={query}
            />
          </label>
          <label className="field">
            {t("prod_name")}
            <select
              className="input"
              onChange={(event) => setProductId(event.target.value)}
              value={productId}
            >
              <option value="">{t("sale_select_product")}</option>
              {filteredProducts.map((product) => (
                <option
                  disabled={Number(product.current_quantity) <= 0}
                  key={product.id}
                  value={product.id}
                >
                  {product.name} - {product.current_quantity} {product.unit}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              className="btn-secondary w-full"
              disabled={!productId}
              onClick={addProduct}
              type="button"
            >
              <Plus className="h-4 w-4" />
              {t("sale_add_btn")}
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line p-8 text-center text-sm font-semibold text-muted">
            {t("sale_no_products_added")}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="hidden grid-cols-[1.5fr_120px_120px_120px_44px] gap-0 table-head px-4 py-3 md:grid">
              <span>{t("prod_name")}</span>
              <span>{t("sale_quantity")}</span>
              <span>{t("sale_unit_price")}</span>
              <span>{t("sale_total")}</span>
              <span />
            </div>
            <div className="divide-y divide-line">
              {items.map((item) => (
                <div
                  className="grid gap-3 p-4 md:grid-cols-[1.5fr_120px_120px_120px_44px] md:items-center"
                  key={item.product_id}
                >
                  <div>
                    <p className="font-semibold text-ink">{item.name}</p>
                    <p className="text-xs text-muted">
                      {t("sale_only_avail")} {item.available} {item.unit}
                    </p>
                  </div>
                  <input
                    aria-label={`${t("sale_quantity")} for ${item.name}`}
                    className="input"
                    max={item.available}
                    min="0.01"
                    onChange={(event) =>
                      updateItem(item.product_id, {
                        quantity: Number(event.target.value),
                      })
                    }
                    step="0.01"
                    type="number"
                    value={item.quantity}
                  />
                  <input
                    aria-label={`${t("sale_unit_price")} for ${item.name}`}
                    className="input"
                    min="0"
                    onChange={(event) =>
                      updateItem(item.product_id, {
                        unit_price: Number(event.target.value),
                      })
                    }
                    step="0.01"
                    type="number"
                    value={item.unit_price}
                  />
                  <p className="font-semibold">
                    {formatEtb(item.quantity * item.unit_price)}
                  </p>
                  <button
                    aria-label={`${t("action_delete")} ${item.name}`}
                    className="flex h-10 w-10 items-center justify-center rounded-md text-danger hover:bg-red-50"
                    onClick={() =>
                      setItems((current) =>
                        current.filter(
                          (candidate) =>
                            candidate.product_id !== item.product_id,
                        ),
                      )
                    }
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <form action={formAction} className="panel h-fit space-y-4">
        <input name="items" type="hidden" value={JSON.stringify(payload)} />

        <label className="field">
          {t("sale_customer_filter")}
          <select className="input" name="customer_id">
            <option value="">{t("sale_customer_walk_in")}</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}{" "}
                {customer.business_name ? `- ${customer.business_name}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          {t("sale_date")}
          <input
            className="input"
            defaultValue={today}
            name="sale_date"
            required
            type="date"
          />
        </label>

        <label className="field">
          {t("sale_discount")}
          <input
            className="input"
            min="0"
            name="discount"
            onChange={(event) =>
              setDiscount(cleanNumberInput(event.target.value))
            }
            step="0.01"
            type="number"
            value={discount}
          />
        </label>

        <label className="field">
          {t("sale_amount_paid")}
          <input
            className="input"
            max={total}
            min="0"
            name="amount_paid"
            onChange={(event) =>
              setAmountPaid(cleanNumberInput(event.target.value))
            }
            step="0.01"
            type="number"
            value={amountPaid}
          />
        </label>

        <div className="space-y-2 rounded-lg border border-line bg-paper p-4 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted">{t("sale_subtotal")}</span>
            <strong>{formatEtb(subtotal)}</strong>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted">{t("sale_total")}</span>
            <strong>{formatEtb(total)}</strong>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted">{t("sale_remaining")}</span>
            <strong>{formatEtb(remaining)}</strong>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted">{t("sale_status")}</span>
            <Badge
              tone={
                status === "PAID"
                  ? "green"
                  : status === "PARTIAL"
                    ? "amber"
                    : "red"
              }
            >
              {status}
            </Badge>
          </div>
        </div>

        {status !== "PAID" ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
            {t("sale_credit_warning")}
          </p>
        ) : null}

        <FormMessage state={state} />
        <SubmitButton>{t("sale_complete")}</SubmitButton>
      </form>
    </div>
  );
}
