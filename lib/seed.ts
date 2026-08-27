import { SupabaseClient } from "@supabase/supabase-js";

// Helper to calculate relative date string
const getRelativeDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

export async function clearDemoData(supabase: SupabaseClient, userId: string) {
  console.info("Clearing existing data for user:", userId);

  // Due to RLS, these queries will automatically target the current authenticated user's records.
  // We specify the delete commands in correct order of dependency.
  const tables = [
    "merchant_credits",
    "payment_allocations",
    "payments",
    "sale_items",
    "sales",
    "inventory_movements",
    "products",
    "customers",
  ];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("owner_id", userId);
    if (error) {
      console.error(`Error deleting from table ${table}:`, error);
      throw new Error(`Failed to clear table ${table}: ${error.message}`);
    }
  }

  console.info("Clear database successful.");
}

export async function seedDemoData(supabase: SupabaseClient, userId: string) {
  console.info("Starting demo data seeding for user:", userId);

  // 1. CLEAR DATA FIRST
  await clearDemoData(supabase, userId);

  // 2. DEFINE 5 PRODUCTS
  const productDefinitions = [
    {
      name: "Teff Flour (Standard/Mixed)",
      sku: "TEF-FLR-01",
      category: "Grain & Flour",
      unit: "bag",
      purchase_price: 3800,
      selling_price: 4200,
      initial_qty: 50,
      minimum_stock: 5,
    },
    {
      name: "Wheat Flour (Dubba)",
      sku: "WHT-FLR-02",
      category: "Grain & Flour",
      unit: "bag",
      purchase_price: 2900,
      selling_price: 3200,
      initial_qty: 40,
      minimum_stock: 10,
    },
    {
      name: "Hayat Cooking Oil (3L)",
      sku: "HYT-OIL-3L",
      category: "Edible Oil & Sugar",
      unit: "carton",
      purchase_price: 2100,
      selling_price: 2400,
      initial_qty: 30,
      minimum_stock: 8,
    },
    {
      name: "Harar Coffee Beans",
      sku: "COF-HAR-20",
      category: "Spices & Beverages",
      unit: "bag",
      purchase_price: 6500,
      selling_price: 7400,
      initial_qty: 15,
      minimum_stock: 3,
    },
    {
      name: "Yes Water (0.5L)",
      sku: "YES-WTR-05",
      category: "Beverages",
      unit: "carton",
      purchase_price: 160,
      selling_price: 195,
      initial_qty: 100,
      minimum_stock: 20,
    },
  ];

  console.info("Seeding 5 products...");
  const products: Record<string, string> = {}; // sku -> uuid mapping

  for (const p of productDefinitions) {
    const { data: productId, error } = await supabase.rpc(
      "create_product_with_stock",
      {
        p_name: p.name,
        p_sku: p.sku,
        p_category: p.category,
        p_unit: p.unit,
        p_purchase_price: p.purchase_price,
        p_selling_price: p.selling_price,
        p_initial_quantity: p.initial_qty,
        p_minimum_stock: p.minimum_stock,
        p_created_by: userId,
      },
    );

    if (error) {
      console.error(`Error inserting product ${p.name}:`, error);
      throw new Error(`Failed to seed product ${p.name}: ${error.message}`);
    }

    products[p.sku] = productId;
  }

  // 3. DEFINE 3 CUSTOMERS
  const customerDefinitions = [
    {
      name: "Ahmed Shop",
      phone: "0911223344",
      business_name: "Ahmed Ibrahim Wholesale & Retail",
      address: "Mercato, Addis Ababa",
    },
    {
      name: "Abebe Mini Market",
      phone: "0911334455",
      business_name: "Abebe Kebede Retail",
      address: "Bole, Addis Ababa",
    },
    {
      name: "Selam Trading",
      phone: "0911445566",
      business_name: "Selamawit Tadesse Import/Export",
      address: "Megenagna, Addis Ababa",
    },
  ];

  console.info("Seeding 3 customers...");
  const customers: Record<string, string> = {}; // name -> uuid mapping

  for (const c of customerDefinitions) {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        owner_id: userId,
        name: c.name,
        phone: c.phone,
        business_name: c.business_name,
        address: c.address,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`Error inserting customer ${c.name}:`, error);
      throw new Error(`Failed to seed customer ${c.name}: ${error.message}`);
    }

    customers[c.name] = data.id;
  }

  const getProductInfo = (sku: string) => {
    const def = productDefinitions.find((x) => x.sku === sku);
    if (!def) throw new Error(`Product SKU ${sku} not found in definitions`);
    return {
      id: products[sku],
      price: def.selling_price,
    };
  };

  // 4. DEFINE SALES
  const salesDefinitions = [
    {
      customer: "Ahmed Shop",
      daysAgo: 5,
      discount: 500,
      paid: 15000,
      items: [
        { sku: "TEF-FLR-01", quantity: 5 },
        { sku: "WHT-FLR-02", quantity: 2 },
      ],
    },
    {
      customer: "Abebe Mini Market",
      daysAgo: 3,
      discount: 200,
      paid: 5000,
      items: [
        { sku: "HYT-OIL-3L", quantity: 3 },
        { sku: "YES-WTR-05", quantity: 10 },
      ],
    },
    {
      customer: "Selam Trading",
      daysAgo: 2,
      discount: 800,
      paid: 14000,
      items: [{ sku: "COF-HAR-20", quantity: 2 }],
    },
    {
      customer: "Ahmed Shop",
      daysAgo: 1,
      discount: 0,
      paid: 10000,
      items: [
        { sku: "TEF-FLR-01", quantity: 2 },
        { sku: "COF-HAR-20", quantity: 1 },
      ],
    },
    {
      customer: null, // Walk-in
      daysAgo: 0,
      discount: 0,
      paid: 975,
      items: [{ sku: "YES-WTR-05", quantity: 5 }],
    },
  ];

  console.info("Seeding sales...");
  for (let idx = 0; idx < salesDefinitions.length; idx++) {
    const s = salesDefinitions[idx];
    const customerId = s.customer ? customers[s.customer] : null;
    const saleDate = getRelativeDateStr(s.daysAgo);

    const itemsJson = s.items.map((item) => {
      const info = getProductInfo(item.sku);
      return {
        product_id: info.id,
        quantity: item.quantity,
        unit_price: info.price,
      };
    });

    const { error } = await supabase.rpc("complete_sale", {
      p_customer_id: customerId,
      p_sale_date: saleDate,
      p_discount: s.discount,
      p_amount_paid: s.paid,
      p_items: itemsJson,
      p_created_by: userId,
    });

    if (error) {
      console.error(
        `Error completing sale index ${idx} for ${s.customer || "Walk-in"}:`,
        error,
      );
      throw new Error(`Failed to seed sale index ${idx}: ${error.message}`);
    }
  }

  // 5. DEFINE MERCHANT CREDITS
  const creditDefinitions = [
    {
      customer: "Ahmed Shop",
      amount: 5000,
      daysAgo: 4,
      note: "Advance deposit for upcoming teff order",
    },
    {
      customer: "Selam Trading",
      amount: 10000,
      daysAgo: 1,
      note: "Store credit for future bulk purchases",
    },
  ];

  console.info("Seeding merchant credits...");
  for (const cred of creditDefinitions) {
    const customerId = customers[cred.customer];
    const creditDate = getRelativeDateStr(cred.daysAgo);

    const { error } = await supabase.from("merchant_credits").insert({
      owner_id: userId,
      customer_id: customerId,
      amount: cred.amount,
      credit_date: creditDate,
      note: cred.note,
    });

    if (error) {
      console.error(`Error inserting merchant credit for ${cred.customer}:`, error);
      throw new Error(
        `Failed to seed merchant credit for ${cred.customer}: ${error.message}`,
      );
    }
  }

  // 6. DEFINE PAYMENTS
  const paymentDefinitions = [
    {
      customer: "Ahmed Shop",
      amount: 5000,
      daysAgo: 2,
      note: "Cash payment for debt settlement",
    },
  ];

  console.info("Seeding payments...");
  for (const pay of paymentDefinitions) {
    const customerId = customers[pay.customer];
    const paymentDate = getRelativeDateStr(pay.daysAgo);

    const { error } = await supabase.rpc("record_customer_payment", {
      p_customer_id: customerId,
      p_sale_id: null,
      p_amount: pay.amount,
      p_payment_date: paymentDate,
      p_note: pay.note,
      p_created_by: userId,
    });

    if (error) {
      console.error(`Error recording payment for ${pay.customer}:`, error);
      throw new Error(
        `Failed to seed payment for ${pay.customer}: ${error.message}`,
      );
    }
  }

  console.info("Seeding demo data successfully finished!");
}
