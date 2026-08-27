import { SaleBuilder } from "@/components/forms/sale-builder";
import { createServerSupabaseClient } from "@/lib/supabase";

export default async function NewSalePage() {
  const supabase = await createServerSupabaseClient();
  const [{ data: products }, { data: customers }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id,name,sku,unit,base_unit,selling_price,selling_unit_name,selling_unit_conversion,selling_unit_price,current_quantity",
      )
      .eq("active", true)
      .order("name", { ascending: true }),
    supabase
      .from("customers")
      .select("id,name,business_name")
      .eq("active", true)
      .order("name", { ascending: true }),
  ]);

  return <SaleBuilder customers={customers ?? []} products={products ?? []} />;
}
