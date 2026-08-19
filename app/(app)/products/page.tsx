import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductForm } from "@/components/forms/product-form";
import { StockAdjustmentForm } from "@/components/forms/stock-adjustment-form";
import { createServerSupabaseClient } from "@/lib/supabase";
import { deactivateProduct } from "@/lib/actions";
import { formatEtb, stockStatus } from "@/lib/utils";

export default async function ProductsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const search = params.search ?? "";
  const category = params.category ?? "";
  const supabase = await createServerSupabaseClient();

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
        <h1 className="text-2xl font-bold text-ink">Products</h1>
        <p className="text-sm text-muted">Manage stock, prices, and low-stock alerts.</p>
      </div>

      <section className="panel" id="add-product">
        <h2 className="mb-4 text-base font-bold">Add Product</h2>
        <ProductForm />
      </section>

      <section className="panel">
        <form className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px_auto]" method="get">
          <label className="field">
            Search
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input className="input w-full pl-9" defaultValue={search} name="search" placeholder="Product name" />
            </span>
          </label>
          <label className="field">
            Category
            <select className="input" defaultValue={category} name="category">
              <option value="">All categories</option>
              {uniqueCategories.map((item) => (
                <option key={item} value={item ?? ""}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button className="btn-secondary w-full" type="submit">
              Filter
            </button>
          </div>
        </form>

        {products?.length ? (
          <div className="space-y-3">
            {products.map((product) => {
              const status = stockStatus(Number(product.current_quantity), Number(product.minimum_stock));
              const tone = status === "In Stock" ? "green" : status === "Low Stock" ? "amber" : "red";
              return (
                <details className="rounded-lg border border-line bg-white p-4" key={product.id}>
                  <summary className="cursor-pointer list-none">
                    <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto] md:items-center">
                      <div>
                        <p className="font-bold">{product.name}</p>
                        <p className="text-xs text-muted">{product.sku || "No SKU"}</p>
                      </div>
                      <span className="text-sm">{product.category || "Uncategorized"}</span>
                      <span className="text-sm">{product.unit}</span>
                      <span className="text-sm font-semibold">{formatEtb(product.selling_price)}</span>
                      <span className="text-sm">
                        {product.current_quantity} / min {product.minimum_stock}
                      </span>
                      <Badge tone={tone}>{status}</Badge>
                    </div>
                  </summary>
                  <div className="mt-4 grid gap-4 border-t border-line pt-4 lg:grid-cols-2">
                    <div>
                      <h3 className="mb-3 text-sm font-bold">Edit Product</h3>
                      <ProductForm product={product} />
                    </div>
                    <div>
                      <h3 className="mb-3 text-sm font-bold">Adjust Stock</h3>
                      <StockAdjustmentForm productId={product.id} />
                      <form action={deactivateProduct} className="mt-4">
                        <input name="id" type="hidden" value={product.id} />
                        <button className="btn-danger" type="submit">
                          Deactivate Product
                        </button>
                      </form>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No products yet. Add your first product." />
        )}
      </section>
    </div>
  );
}
