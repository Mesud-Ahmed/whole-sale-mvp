import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createServerSupabaseClient } from "@/lib/supabase";
import { formatDate, formatEtb } from "@/lib/utils";

export default async function SalesPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("sales")
    .select("id,sale_date,total_amount,amount_paid,payment_status,customers(name,business_name)")
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (params.status) query = query.eq("payment_status", params.status);
  if (params.from) query = query.gte("sale_date", params.from);
  if (params.to) query = query.lte("sale_date", params.to);

  const { data: sales } = await query;
  const search = (params.customer ?? "").toLowerCase();
  const filtered = (sales ?? []).filter((sale) => {
    const customer = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers;
    if (!search) return true;
    return (
      (customer?.name ?? "").toLowerCase().includes(search) ||
      (customer?.business_name ?? "").toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Sales</h1>
          <p className="text-sm text-muted">Review sales and payment status.</p>
        </div>
        <Link className="btn-primary" href="/sales/new">
          New Sale
        </Link>
      </div>

      <section className="panel">
        <form className="mb-4 grid gap-3 lg:grid-cols-[1fr_160px_160px_160px_auto]" method="get">
          <label className="field">
            Customer
            <input className="input" defaultValue={params.customer ?? ""} name="customer" placeholder="Customer name" />
          </label>
          <label className="field">
            From
            <input className="input" defaultValue={params.from ?? ""} name="from" type="date" />
          </label>
          <label className="field">
            To
            <input className="input" defaultValue={params.to ?? ""} name="to" type="date" />
          </label>
          <label className="field">
            Status
            <select className="input" defaultValue={params.status ?? ""} name="status">
              <option value="">All</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="CREDIT">Credit</option>
            </select>
          </label>
          <div className="flex items-end">
            <button className="btn-secondary w-full" type="submit">
              Filter
            </button>
          </div>
        </form>

        {filtered.length ? (
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="hidden table-head grid-cols-6 px-4 py-3 lg:grid">
              <span>Sale ID</span>
              <span>Date</span>
              <span>Customer</span>
              <span>Total</span>
              <span>Remaining</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-line">
              {filtered.map((sale) => {
                const customer = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers;
                const remaining = Math.max(Number(sale.total_amount) - Number(sale.amount_paid), 0);
                return (
                  <Link className="grid gap-2 p-4 text-sm hover:bg-paper lg:grid-cols-6" href={`/sales/${sale.id}`} key={sale.id}>
                    <span className="font-mono text-xs">{sale.id.slice(0, 8)}</span>
                    <span>{formatDate(sale.sale_date)}</span>
                    <span className="font-semibold">{customer?.name ?? "Walk-in customer"}</span>
                    <span>{formatEtb(sale.total_amount)}</span>
                    <span>{formatEtb(remaining)}</span>
                    <Badge tone={sale.payment_status === "PAID" ? "green" : sale.payment_status === "PARTIAL" ? "amber" : "red"}>
                      {sale.payment_status}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState title="No sales recorded yet." action={<Link className="btn-primary" href="/sales/new">Record first sale</Link>} />
        )}
      </section>
    </div>
  );
}
