import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LiveSearch } from "@/components/ui/live-search";
import { ProductDrawer } from "@/components/forms/product-drawer";
import { DeleteProductButton } from "@/components/forms/delete-product-button";
import { createServerSupabaseClient } from "@/lib/supabase";
import { deactivateProduct } from "@/lib/actions";
import { formatEtb, stockStatus } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/server";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const search = params.search ?? "";
  const supabase = await createServerSupabaseClient();
  const { t } = await getDictionary();

  let query = supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("name", `%${search}%`);

  const { data: products } = await query;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("prod_title")}</h1>
        <p className="text-sm text-muted">{t("prod_subtitle")}</p>
      </div>

      <section className="panel" id="add-product">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">{t("prod_add")}</h2>
            <p className="text-xs text-muted">{t("prod_subtitle")}</p>
          </div>
          <ProductDrawer />
        </div>
      </section>

      <section className="panel">
        <div className="mb-4 max-w-md">
          <LiveSearch
            initialValue={search}
            label={t("prod_search")}
            placeholder={t("prod_search_placeholder")}
          />
        </div>

        {products?.length ? (
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-paper text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">
                      {t("prod_name")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t("prod_unit")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t("prod_selling_price")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t("prod_quantity")}
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      {t("prod_status")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-right">
                      {t("action_edit")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const status = stockStatus(
                      Number(product.current_quantity),
                      Number(product.minimum_stock),
                    );
                    const tone =
                      status === "In Stock"
                        ? "green"
                        : status === "Low Stock"
                          ? "amber"
                          : "red";
                    const statusKey =
                      status === "In Stock"
                        ? "prod_in_stock"
                        : status === "Low Stock"
                          ? "prod_low_stock"
                          : "prod_out_of_stock";

                    return (
                      <tr
                        className="border-t border-line align-top"
                        key={product.id}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold">{product.name}</div>
                          <div className="text-xs text-muted">
                            {Number(product.current_quantity)} /{" "}
                            {Number(product.minimum_stock)} min
                          </div>
                        </td>
                        <td className="px-4 py-3">{product.unit}</td>
                        <td className="px-4 py-3 font-semibold">
                          {formatEtb(product.selling_price)}
                        </td>
                        <td className="px-4 py-3">
                          {product.current_quantity}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={tone}>{t(statusKey)}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <ProductDrawer product={product} />
                            <DeleteProductButton
                              id={product.id}
                              label={t("action_delete")}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState title={t("prod_add_first")} />
        )}
      </section>
    </div>
  );
}
