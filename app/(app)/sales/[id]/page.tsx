import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { createServerSupabaseClient } from "@/lib/supabase";
import { formatDate, formatEtb } from "@/lib/utils";

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const [{ data: sale }, { data: items }, { data: allocations }] = await Promise.all([
    supabase
      .from("sales")
      .select("*,customers(id,name,business_name,phone)")
      .eq("id", id)
      .single(),
    supabase
      .from("sale_items")
      .select("id,quantity,unit_price,total,products(name,unit,sku)")
      .eq("sale_id", id),
    supabase
      .from("payment_allocations")
      .select("amount,payments(payment_date,note)")
      .eq("sale_id", id)
  ]);

  if (!sale) notFound();

  const customer = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers;
  const remaining = Math.max(Number(sale.total_amount) - Number(sale.amount_paid), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link className="text-sm font-semibold text-brand-700" href="/sales">
            Back to sales
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-ink">Sale {sale.id.slice(0, 8)}</h1>
          <p className="text-sm text-muted">{formatDate(sale.sale_date)}</p>
        </div>
        <Badge tone={sale.payment_status === "PAID" ? "green" : sale.payment_status === "PARTIAL" ? "amber" : "red"}>
          {sale.payment_status}
        </Badge>
      </div>

      <section className="grid gap-4 sm:grid-cols-4">
        <div className="panel">
          <p className="text-sm text-muted">Total</p>
          <p className="mt-2 text-xl font-bold">{formatEtb(sale.total_amount)}</p>
        </div>
        <div className="panel">
          <p className="text-sm text-muted">Amount Paid</p>
          <p className="mt-2 text-xl font-bold">{formatEtb(sale.amount_paid)}</p>
        </div>
        <div className="panel">
          <p className="text-sm text-muted">Remaining</p>
          <p className="mt-2 text-xl font-bold">{formatEtb(remaining)}</p>
        </div>
        <div className="panel">
          <p className="text-sm text-muted">Customer</p>
          <p className="mt-2 text-base font-bold">{customer?.name ?? "Walk-in customer"}</p>
        </div>
      </section>

      <section className="panel">
        <h2 className="mb-4 text-base font-bold">Products</h2>
        <div className="overflow-hidden rounded-lg border border-line">
          <div className="hidden table-head grid-cols-5 px-4 py-3 md:grid">
            <span>Product</span>
            <span>Quantity</span>
            <span>Unit Price</span>
            <span>Total</span>
            <span>SKU</span>
          </div>
          <div className="divide-y divide-line">
            {(items ?? []).map((item) => {
              const product = Array.isArray(item.products) ? item.products[0] : item.products;
              return (
                <div className="grid gap-2 p-4 text-sm md:grid-cols-5" key={item.id}>
                  <span className="font-semibold">{product?.name ?? "Product"}</span>
                  <span>{item.quantity} {product?.unit ?? ""}</span>
                  <span>{formatEtb(item.unit_price)}</span>
                  <span>{formatEtb(item.total)}</span>
                  <span className="text-muted">{product?.sku || "-"}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="mb-4 text-base font-bold">Payment History</h2>
        {allocations?.length ? (
          <div className="space-y-3">
            {allocations.map((allocation, index) => {
              const payment = Array.isArray(allocation.payments) ? allocation.payments[0] : allocation.payments;
              return (
                <div className="rounded-md border border-line p-3 text-sm" key={`${sale.id}-${index}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{formatEtb(allocation.amount)}</span>
                    <span className="text-muted">{formatDate(payment?.payment_date)}</span>
                  </div>
                  {payment?.note ? <p className="mt-1 text-muted">{payment.note}</p> : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm font-medium text-muted">No payments recorded for this sale.</p>
        )}
      </section>
    </div>
  );
}
