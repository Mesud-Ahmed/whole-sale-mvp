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

  // 2. DEFINE PRODUCTS (Calculated to yield correct final quantities after sales)
  // Fields: name, sku, category, unit, purchase_price, selling_price, initial_qty, minimum_stock
  const productDefinitions = [
    {
      name: "Teff Flour (Standard/Mixed)",
      sku: "TEF-FLR-01",
      category: "Grain & Flour",
      unit: "bag",
      purchase_price: 3800,
      selling_price: 4200,
      initial_qty: 55,
      minimum_stock: 5,
    },
    {
      name: "Wheat Flour (Dubba)",
      sku: "WHT-FLR-02",
      category: "Grain & Flour",
      unit: "bag",
      purchase_price: 2900,
      selling_price: 3200,
      initial_qty: 55,
      minimum_stock: 10,
    },
    {
      name: "Sheno Butter",
      sku: "SHN-BTR-03",
      category: "Edible Oil & Sugar",
      unit: "kg",
      purchase_price: 450,
      selling_price: 520,
      initial_qty: 14,
      minimum_stock: 5,
    },
    {
      name: "Hayat Cooking Oil (3L)",
      sku: "HYT-OIL-3L",
      category: "Edible Oil & Sugar",
      unit: "carton",
      purchase_price: 2100,
      selling_price: 2400,
      initial_qty: 44,
      minimum_stock: 8,
    },
    {
      name: "Hayat Cooking Oil (5L)",
      sku: "HYT-OIL-5L",
      category: "Edible Oil & Sugar",
      unit: "carton",
      purchase_price: 2300,
      selling_price: 2600,
      initial_qty: 33,
      minimum_stock: 5,
    },
    {
      name: "Mata Sugar (Local)",
      sku: "SGR-BAG-50",
      category: "Edible Oil & Sugar",
      unit: "bag",
      purchase_price: 4100,
      selling_price: 4500,
      initial_qty: 7,
      minimum_stock: 10,
    },
    {
      name: "Beri Pasta (500g)",
      sku: "BER-PST-07",
      category: "Grain & Flour",
      unit: "carton",
      purchase_price: 780,
      selling_price: 890,
      initial_qty: 51,
      minimum_stock: 15,
    },
    {
      name: "Santa Macaroni (500g)",
      sku: "SNT-MAC-08",
      category: "Grain & Flour",
      unit: "carton",
      purchase_price: 740,
      selling_price: 850,
      initial_qty: 17,
      minimum_stock: 15,
    },
    {
      name: "Yes Water (0.5L)",
      sku: "YES-WTR-05",
      category: "Beverages",
      unit: "carton",
      purchase_price: 160,
      selling_price: 195,
      initial_qty: 200,
      minimum_stock: 30,
    },
    {
      name: "Yes Water (2L)",
      sku: "YES-WTR-20",
      category: "Beverages",
      unit: "carton",
      purchase_price: 110,
      selling_price: 135,
      initial_qty: 0,
      minimum_stock: 20,
    },
    {
      name: "Coca Cola (Plastic 0.5L)",
      sku: "COK-05L",
      category: "Beverages",
      unit: "carton",
      purchase_price: 220,
      selling_price: 260,
      initial_qty: 115,
      minimum_stock: 20,
    },
    {
      name: "Fanta Orange (Plastic 0.5L)",
      sku: "FNT-05L",
      category: "Beverages",
      unit: "carton",
      purchase_price: 220,
      selling_price: 260,
      initial_qty: 15,
      minimum_stock: 20,
    },
    {
      name: "Harar Coffee Beans",
      sku: "COF-HAR-20",
      category: "Spices & Beverages",
      unit: "bag",
      purchase_price: 6500,
      selling_price: 7400,
      initial_qty: 18,
      minimum_stock: 3,
    },
    {
      name: "Wush Wush Tea (Leaf)",
      sku: "TEA-WSH-50",
      category: "Spices & Beverages",
      unit: "carton",
      purchase_price: 1200,
      selling_price: 1450,
      initial_qty: 40,
      minimum_stock: 5,
    },
    {
      name: "Largo Liquid Detergent",
      sku: "LRG-DET-01",
      category: "Personal Care & Cleaning",
      unit: "box",
      purchase_price: 850,
      selling_price: 980,
      initial_qty: 35,
      minimum_stock: 5,
    },
    {
      name: "Barra Soap (Laundry)",
      sku: "BAR-SOP-02",
      category: "Personal Care & Cleaning",
      unit: "box",
      purchase_price: 720,
      selling_price: 820,
      initial_qty: 45,
      minimum_stock: 10,
    },
    {
      name: "Dano Milk Powder (900g)",
      sku: "DAN-MLK-900",
      category: "Edible Oil & Sugar",
      unit: "carton",
      purchase_price: 6200,
      selling_price: 6900,
      initial_qty: 23,
      minimum_stock: 4,
    },
  ];

  console.info("Seeding products...");
  const products: Record<string, string> = {}; // sku -> uuid mapping

  for (const p of productDefinitions) {
    const { data: productId, error } = await supabase.rpc(
      "create_product_with_stock",
      {
        p_name: p.name,
        p_sku: p.sku,
        p_category: p.category,
        p_unit: p.unit,
        p_base_unit: p.unit,
        p_selling_unit_name: null,
        p_selling_unit_conversion: null,
        p_selling_unit_price: null,
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

  // 3. DEFINE CUSTOMERS
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
    {
      name: "Beka Store",
      phone: "0911556677",
      business_name: "Bekele Demissie General Merchant",
      address: "Kera, Addis Ababa",
    },
    {
      name: "Hana Grocery",
      phone: "0911667788",
      business_name: "Hana Tekle Convenience Store",
      address: "CMC, Addis Ababa",
    },
    {
      name: "Aman General Store",
      phone: "0911778899",
      business_name: "Amanuel Girma Enterprise",
      address: "Piazza, Addis Ababa",
    },
    {
      name: "Mulugeta Shop",
      phone: "0911889900",
      business_name: "Mulugeta Abebe Shop",
      address: "Jemma, Addis Ababa",
    },
    {
      name: "Bethel Market",
      phone: "0912112233",
      business_name: "Bethelhem Tesfaye Supermarket",
      address: "Bethel, Addis Ababa",
    },
    {
      name: "Kedir Trading",
      phone: "0912223344",
      business_name: "Kedir Mohammed Shop",
      address: "Kolfe, Addis Ababa",
    },
    {
      name: "Fikir Grocery",
      phone: "0912334455",
      business_name: "Fikirte Assefa Grocery",
      address: "Lebu, Addis Ababa",
    },
  ];

  console.info("Seeding customers...");
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

  // Helper to map sku -> details
  const getProductInfo = (sku: string) => {
    const def = productDefinitions.find((x) => x.sku === sku);
    if (!def) throw new Error(`Product SKU ${sku} not found in definitions`);
    return {
      id: products[sku],
      price: def.selling_price,
    };
  };

  // 4. DEFINE HISTORICAL SALES & ASSOCIATED INITIAL PAYMENTS (using complete_sale)
  // We execute these sequentially so transactions are recorded in cron order.
  const salesDefinitions = [
    {
      customer: "Ahmed Shop",
      daysAgo: 10,
      discount: 1000,
      paid: 0,
      items: [
        { sku: "TEF-FLR-01", quantity: 10 },
        { sku: "WHT-FLR-02", quantity: 5 },
      ],
    },
    {
      customer: "Abebe Mini Market",
      daysAgo: 9,
      discount: 380,
      paid: 5000,
      items: [
        { sku: "HYT-OIL-3L", quantity: 4 },
        { sku: "BER-PST-07", quantity: 2 },
      ],
    },
    {
      customer: "Selam Trading",
      daysAgo: 9,
      discount: 800,
      paid: 14000,
      items: [{ sku: "COF-HAR-20", quantity: 2 }],
    },
    {
      customer: "Beka Store",
      daysAgo: 8,
      discount: 600,
      paid: 10000,
      items: [
        { sku: "SGR-BAG-50", quantity: 5 },
        { sku: "BAR-SOP-02", quantity: 5 },
      ],
    },
    {
      customer: "Aman General Store",
      daysAgo: 8,
      discount: 1500,
      paid: 0,
      items: [
        { sku: "DAN-MLK-900", quantity: 5 },
        { sku: "TEF-FLR-01", quantity: 10 },
      ],
    },
    {
      customer: "Kedir Trading",
      daysAgo: 7,
      discount: 1250,
      paid: 12000,
      items: [
        { sku: "HYT-OIL-5L", quantity: 10 },
        { sku: "TEA-WSH-50", quantity: 5 },
      ],
    },
    {
      customer: "Ahmed Shop",
      daysAgo: 7,
      discount: 0,
      paid: 0,
      items: [
        { sku: "COF-HAR-20", quantity: 3 },
        { sku: "LRG-DET-01", quantity: 10 },
      ],
    },
    {
      customer: "Hana Grocery",
      daysAgo: 6,
      discount: 500,
      paid: 6000,
      items: [
        { sku: "YES-WTR-05", quantity: 20 },
        { sku: "COK-05L", quantity: 10 },
      ],
    },
    {
      customer: "Mulugeta Shop",
      daysAgo: 5,
      discount: 250,
      paid: 8000,
      items: [
        { sku: "WHT-FLR-02", quantity: 5 },
        { sku: "SNT-MAC-08", quantity: 5 },
      ],
    },
    {
      customer: "Fikir Grocery",
      daysAgo: 5,
      discount: 0,
      paid: 3000,
      items: [
        { sku: "LRG-DET-01", quantity: 5 },
        { sku: "BAR-SOP-02", quantity: 5 },
      ],
    },
    {
      customer: "Bethel Market",
      daysAgo: 4,
      discount: 1000,
      paid: 32000,
      items: [
        { sku: "TEF-FLR-01", quantity: 5 },
        { sku: "HYT-OIL-3L", quantity: 5 },
      ],
    },
    {
      customer: "Ahmed Shop",
      daysAgo: 3,
      discount: 3000,
      paid: 15000,
      items: [{ sku: "DAN-MLK-900", quantity: 10 }],
    },
    {
      customer: "Beka Store",
      daysAgo: 3,
      discount: 0,
      paid: 13000,
      items: [{ sku: "TEF-FLR-01", quantity: 10 }],
    },
    {
      customer: "Aman General Store",
      daysAgo: 3,
      discount: 0,
      paid: 30000,
      items: [
        { sku: "WHT-FLR-02", quantity: 10 },
        { sku: "HYT-OIL-5L", quantity: 5 },
      ],
    },
    {
      customer: "Kedir Trading",
      daysAgo: 2,
      discount: 1300,
      paid: 13000,
      items: [
        { sku: "COF-HAR-20", quantity: 2 },
        { sku: "TEA-WSH-50", quantity: 10 },
      ],
    },
    {
      customer: "Selam Trading",
      daysAgo: 2,
      discount: 450,
      paid: 14500,
      items: [
        { sku: "YES-WTR-05", quantity: 50 },
        { sku: "COK-05L", quantity: 20 },
      ],
    },
    {
      customer: "Abebe Mini Market",
      daysAgo: 1,
      discount: 760,
      paid: 0,
      items: [
        { sku: "SHN-BTR-03", quantity: 10 },
        { sku: "BER-PST-07", quantity: 4 },
      ],
    },
    {
      customer: "Hana Grocery",
      daysAgo: 1,
      discount: 0,
      paid: 2600,
      items: [{ sku: "FNT-05L", quantity: 10 }],
    },
    {
      customer: "Bethel Market",
      daysAgo: 1,
      discount: 0,
      paid: 4900,
      items: [{ sku: "LRG-DET-01", quantity: 5 }],
    },
    {
      customer: "Beka Store",
      daysAgo: 0,
      discount: 0,
      paid: 14000,
      items: [{ sku: "HYT-OIL-3L", quantity: 10 }],
    },
    {
      customer: null, // Walk-in
      daysAgo: 0,
      discount: 250,
      paid: 3000,
      items: [
        { sku: "YES-WTR-05", quantity: 10 },
        { sku: "COK-05L", quantity: 5 },
      ],
    },
    {
      customer: "Selam Trading",
      daysAgo: 0,
      discount: 1000,
      paid: 36000,
      items: [
        { sku: "TEF-FLR-01", quantity: 5 },
        { sku: "WHT-FLR-02", quantity: 5 },
      ],
    },
    {
      customer: "Aman General Store",
      daysAgo: 0,
      discount: 400,
      paid: 7000,
      items: [{ sku: "COF-HAR-20", quantity: 1 }],
    },
  ];

  console.info("Seeding sales...");
  const salesMap: Record<number, string> = {}; // index -> sale ID

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

    const { data: saleId, error } = await supabase.rpc("complete_sale", {
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

    salesMap[idx] = saleId;
  }

  // 5. DEFINE EXTRA PAYMENTS (to pay down debt historically)
  const paymentDefinitions = [
    {
      customer: "Ahmed Shop",
      amount: 20000,
      daysAgo: 6,
      note: "Cash installment paid at office",
    },
    {
      customer: "Abebe Mini Market",
      amount: 3000,
      daysAgo: 4,
      note: "Bank transfer CBE",
    },
    { customer: "Beka Store", amount: 10000, daysAgo: 2, note: "Cash payment" },
    {
      customer: "Abebe Mini Market",
      amount: 3000,
      daysAgo: 1,
      note: "Cleared CBE remaining debt for past purchase",
    },
  ];

  console.info("Seeding payments...");

  for (const pay of paymentDefinitions) {
    const customerId = customers[pay.customer];
    const paymentDate = getRelativeDateStr(pay.daysAgo);

    const { error } = await supabase.rpc("record_customer_payment", {
      p_customer_id: customerId,
      p_sale_id: null, // auto-allocate FIFO
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

  // 6. DEFINE STOCK ADJUSTMENTS
  const adjustments = [
    {
      sku: "SNT-MAC-08",
      quantity: 5,
      daysAgo: 1,
      note: "Restocked from local supplier",
    },
    {
      sku: "TEA-WSH-50",
      quantity: -2,
      daysAgo: 1,
      note: "Damaged box discarded",
    },
  ];

  console.info("Seeding adjustments...");

  for (const adj of adjustments) {
    const productId = products[adj.sku];
    const { error } = await supabase.rpc("adjust_stock", {
      p_product_id: productId,
      p_quantity: adj.quantity,
      p_note: adj.note,
      p_created_by: userId,
    });

    if (error) {
      console.error(`Error adjusting stock for SKU ${adj.sku}:`, error);
      throw new Error(
        `Failed to seed adjustment for SKU ${adj.sku}: ${error.message}`,
      );
    }
  }

  console.info("Seeding demo data successfully finished!");
}
