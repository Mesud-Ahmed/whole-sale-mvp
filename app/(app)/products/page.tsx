import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductForm } from "@/components/forms/product-form";
import { StockAdjustmentForm } from "@/components/forms/stock-adjustment-form";
import { createServerSupabaseClient } from "@/lib/supabase";
import { deactivateProduct } from "@/lib/actions";
import { formatEtb, stockStatus } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/server";

export default async function ProductsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const search = params.search ?? "";
  const category = params.category ?? "";
  const supabase = await createServerSupabaseClient();
  const { t } = await getDictionary();

  let query = supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  if (category) query = query.eq("category", category);

  const [{ data: products }, { data: categories }] = await Promise.all([
    query,
    supabase.from("products").select("category").eq("active", true).not("category", "is", null)
  ]);

  const uniqueCategories = Array.from(new Set((categories ?? []).map((item) => item.category).filter(Boolean)));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("prod_title")}</h1>
        <p className="text-sm text-muted">{t("prod_subtitle")}</p>
      </div>

      <section className="panel" id="add-product">
        <h2 className="mb-4 text-base font-bold">{t("prod_add")}</h2>
        <ProductForm />
      </section>

      <section className="panel">
        <form className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px_auto]" method="get">
          <label className="field">
            {t("prod_search")}
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input className="input w-full pl-9" defaultValue={search} name="search" placeholder={t("prod_search_placeholder")} />
            </span>
          </label>
          <label className="field">
            {t("prod_category")}
            <select className="input" defaultValue={category} name="category">
              <option value="">{t("prod_all_categories")}</option>
              {uniqueCategories.map((item) => (
                <option key={item} value={item ?? ""}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button className="btn-secondary w-full" type="submit">
              {t("action_filter")}
            </button>
          </div>
        </form>

        {products?.length ? (
          <div className="space-y-3">
            {products.map((product) => {
              const status = stockStatus(Number(product.current_quantity), Number(product.minimum_stock));
              // status is "In Stock", "Low Stock", or "Out of Stock"
              const tone = status === "In Stock" ? "green" : status === "Low Stock" ? "amber" : "red";
              // Translate the status label dynamically based on English key
              const statusKey = status === "In Stock" ? "prod_in_stock" : status === "Low Stock" ? "prod_low_stock" : "prod_out_of_stock";

              return (
                <details className="rounded-lg border border-line bg-white p-4" key={product.id}>
                  <summary className="cursor-pointer list-none">
                    <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto] md:items-center">
                      <div>
                        <p className="font-bold">{product.name}</p>
                        <p className="text-xs text-muted">{product.sku || t("prod_no_sku")}</p>
                      </div>
                      <span className="text-sm">{product.category || t("prod_uncategorized")}</span>
                      <span className="text-sm">{product.unit}</span>
                      <span className="text-sm font-semibold">{formatEtb(product.selling_price)}</span>
                      <span className="text-sm">
                        {product.current_quantity} / min {product.minimum_stock}
                      </span>
                      <Badge tone={tone}>{t(statusKey)}</Badge>
                    </div>
                  </summary>
                  <div className="mt-4 grid gap-4 border-t border-line pt-4 lg:grid-cols-2">
                    <div>
                      <h3 className="mb-3 text-sm font-bold">{t("prod_edit")}</h3>
                      <ProductForm product={product} />
                    </div>
                    <div>
                      <h3 className="mb-3 text-sm font-bold">{t("prod_adjust_stock")}</h3>
                      <StockAdjustmentForm productId={product.id} />
                      <form action={deactivateProduct} className="mt-4">
                        <input name="id" type="hidden" value={product.id} />
                        <button className="btn-danger" type="submit">
                          {t("prod_deactivate")}
                        </button>
                      </form>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <EmptyState title={t("prod_add_first")} />
        )}
      </section>
    </div>
  );
}
