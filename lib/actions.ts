"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase";
import { toNumber } from "@/lib/utils";
import { seedDemoData, clearDemoData } from "@/lib/seed";

export type FormState = { ok: boolean; message: string } | null;

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Product name is required"),
  unit: z.string().min(1, "Unit is required"),
  purchase_price: z.number().min(0),
  selling_price: z.number().min(0),
  current_quantity: z.number().min(0),
  minimum_stock: z.number().min(0),
  selling_unit_name: z.string().optional().nullable(),
  selling_unit_conversion: z.number().min(0.0001).optional().nullable(),
  selling_unit_price: z.number().min(0).optional().nullable(),
});

const customerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().optional(),
  business_name: z.string().optional(),
  address: z.string().optional(),
});

function formError(message: string): FormState {
  return { ok: false, message };
}

async function getUserId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

export async function signIn(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createServerSupabaseClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("signIn error", { email, error });
    if (error.message.includes("Email not confirmed")) {
      return formError("Email not confirmed. Please check your inbox.");
    }
    return formError("Invalid email or password.");
  }
  redirect("/dashboard");
}

export async function signUp(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createServerSupabaseClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    console.error("signUp error", { email, error });
    return formError(error.message);
  }

  if (data?.session === null) {
    return {
      ok: true,
      message:
        "Signup successful! Please check your email to confirm your account.",
    };
  }

  console.info("signUp success", { email, user: data?.user?.id });
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function saveProduct(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, userId } = await getUserId();
  const baseUnit = String(formData.get("unit") || "piece").trim() || "piece";
  const sellingUnitName = String(
    formData.get("selling_unit_name") ?? "",
  ).trim();
  const sellingUnitConversion = toNumber(
    formData.get("selling_unit_conversion"),
  );
  const sellingUnitPrice = toNumber(formData.get("selling_unit_price"));
  const hasAlternativeSellingUnit =
    Boolean(sellingUnitName) ||
    sellingUnitConversion > 0 ||
    sellingUnitPrice > 0;

  if (hasAlternativeSellingUnit) {
    if (
      !sellingUnitName ||
      sellingUnitConversion <= 0 ||
      sellingUnitPrice < 0
    ) {
      return formError(
        "Complete the additional selling unit details to save the product.",
      );
    }
  }

  const parsed = productSchema.safeParse({
    id: String(formData.get("id") || "") || undefined,
    name: String(formData.get("name") ?? "").trim(),
    unit: baseUnit,
    purchase_price: toNumber(formData.get("purchase_price")),
    selling_price: toNumber(formData.get("selling_price")),
    current_quantity: toNumber(formData.get("current_quantity")),
    minimum_stock: toNumber(formData.get("minimum_stock")),
    selling_unit_name: hasAlternativeSellingUnit ? sellingUnitName : null,
    selling_unit_conversion: hasAlternativeSellingUnit
      ? sellingUnitConversion
      : null,
    selling_unit_price: hasAlternativeSellingUnit ? sellingUnitPrice : null,
  });

  if (!parsed.success)
    return formError("Please check the product form and try again.");

  if (parsed.data.id) {
    const { error } = await supabase
      .from("products")
      .update({
        name: parsed.data.name,
        unit: parsed.data.unit,
        base_unit: parsed.data.unit,
        selling_unit_name: parsed.data.selling_unit_name,
        selling_unit_conversion: parsed.data.selling_unit_conversion,
        selling_unit_price: parsed.data.selling_unit_price,
        purchase_price: parsed.data.purchase_price,
        selling_price: parsed.data.selling_price,
        minimum_stock: parsed.data.minimum_stock,
      })
      .eq("id", parsed.data.id);

    if (error) return formError("Could not update product.");
  } else {
    const { error } = await supabase.rpc("create_product_with_stock", {
      p_name: parsed.data.name,
      p_sku: null,
      p_category: null,
      p_unit: parsed.data.unit,
      p_base_unit: parsed.data.unit,
      p_selling_unit_name: parsed.data.selling_unit_name,
      p_selling_unit_conversion: parsed.data.selling_unit_conversion,
      p_selling_unit_price: parsed.data.selling_unit_price,
      p_purchase_price: parsed.data.purchase_price,
      p_selling_price: parsed.data.selling_price,
      p_initial_quantity: parsed.data.current_quantity,
      p_minimum_stock: parsed.data.minimum_stock,
      p_created_by: userId,
    });

    if (error) return formError("Could not create product.");
  }

  revalidatePath("/products");
  revalidatePath("/dashboard");
  return { ok: true, message: "Product saved." };
}

export async function deactivateProduct(formData: FormData) {
  const { supabase } = await getUserId();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase
    .from("products")
    .update({ active: false })
    .eq("id", id);
  if (error) return;
  revalidatePath("/products");
  revalidatePath("/dashboard");
}

export async function adjustStock(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, userId } = await getUserId();
  const productId = String(formData.get("product_id") ?? "");
  const quantity = toNumber(formData.get("quantity"));
  const direction = String(formData.get("direction") ?? "increase");
  const note = String(formData.get("note") ?? "").trim();
  const signedQuantity =
    direction === "decrease" ? -Math.abs(quantity) : Math.abs(quantity);

  if (!productId || quantity <= 0)
    return formError("Enter a valid stock adjustment.");

  const { error } = await supabase.rpc("adjust_stock", {
    p_product_id: productId,
    p_quantity: signedQuantity,
    p_note: note || null,
    p_created_by: userId,
  });

  if (error)
    return formError(
      error.message.includes("Insufficient")
        ? "Insufficient stock."
        : "Could not adjust stock.",
    );
  revalidatePath("/products");
  revalidatePath("/dashboard");
  return { ok: true, message: "Stock adjusted." };
}

export async function saveCustomer(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, userId } = await getUserId();
  const parsed = customerSchema.safeParse({
    id: String(formData.get("id") || "") || undefined,
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    business_name: String(formData.get("business_name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
  });

  if (!parsed.success) return formError("Please enter a customer name.");

  if (parsed.data.id) {
    const { error } = await supabase
      .from("customers")
      .update({
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        business_name: parsed.data.business_name || null,
        address: parsed.data.address || null,
      })
      .eq("id", parsed.data.id);
    if (error) return formError("Could not update customer.");
  } else {
    const { error } = await supabase.from("customers").insert({
      owner_id: userId,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      business_name: parsed.data.business_name || null,
      address: parsed.data.address || null,
    });
    if (error) return formError("Could not create customer.");
  }

  revalidatePath("/customers");
  revalidatePath("/dashboard");
  return { ok: true, message: "Customer saved." };
}

export async function completeSale(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, userId } = await getUserId();
  const items = JSON.parse(String(formData.get("items") ?? "[]")) as Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    unit_name?: string;
  }>;
  const customerId = String(formData.get("customer_id") || "") || null;
  const discount = toNumber(formData.get("discount"));
  const amountPaid = toNumber(formData.get("amount_paid"));
  const saleDate = String(
    formData.get("sale_date") || new Date().toISOString().slice(0, 10),
  );

  if (items.length === 0) return formError("Add at least one product.");

  const { data, error } = await supabase.rpc("complete_sale", {
    p_customer_id: customerId,
    p_sale_date: saleDate,
    p_discount: discount,
    p_amount_paid: amountPaid,
    p_items: items.map((item) => ({
      ...item,
      unit_name: item.unit_name || "",
    })),
    p_created_by: userId,
  });

  if (error) return formError(error.message);

  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  redirect(`/sales/${data}`);
}

export async function recordPayment(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, userId } = await getUserId();
  const customerId = String(formData.get("customer_id") ?? "");
  const saleId = String(formData.get("sale_id") || "") || null;
  const amount = toNumber(formData.get("amount"));
  const paymentDate = String(
    formData.get("payment_date") || new Date().toISOString().slice(0, 10),
  );
  const note = String(formData.get("note") ?? "").trim();

  if (!customerId || amount <= 0)
    return formError("Select a customer and enter a valid amount.");

  const { error } = await supabase.rpc("record_customer_payment", {
    p_customer_id: customerId,
    p_sale_id: saleId,
    p_amount: amount,
    p_payment_date: paymentDate,
    p_note: note || null,
    p_created_by: userId,
  });

  if (error) return formError(error.message);

  revalidatePath("/payments");
  revalidatePath("/customers");
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return { ok: true, message: "Payment recorded." };
}

export async function saveMerchantCredit(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const { supabase, userId } = await getUserId();
  const customerId = String(formData.get("customer_id") ?? "");
  const amount = toNumber(formData.get("amount"));
  const creditDate = String(
    formData.get("credit_date") || new Date().toISOString().slice(0, 10),
  );
  const note = String(formData.get("note") ?? "").trim();

  if (!customerId || amount <= 0)
    return formError("Select a customer and enter a valid credit amount.");

  const { error } = await supabase.from("merchant_credits").insert({
    owner_id: userId,
    customer_id: customerId,
    amount,
    credit_date: creditDate,
    note: note || null,
  });

  if (error) return formError(error.message);

  revalidatePath("/payments");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  return { ok: true, message: "Merchant credit recorded." };
}

export async function seedDemoDataAction(): Promise<FormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return formError("Not authenticated.");
  }
  try {
    await seedDemoData(supabase, user.id);
    revalidatePath("/dashboard");
    revalidatePath("/products");
    revalidatePath("/customers");
    revalidatePath("/sales");
    revalidatePath("/payments");
    return { ok: true, message: "Demo data seeded successfully!" };
  } catch (error) {
    console.error("Seeding action failed:", error);
    return formError(
      error instanceof Error ? error.message : "Seeding failed.",
    );
  }
}

export async function clearDemoDataAction(): Promise<FormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return formError("Not authenticated.");
  }
  try {
    await clearDemoData(supabase, user.id);
    revalidatePath("/dashboard");
    revalidatePath("/products");
    revalidatePath("/customers");
    revalidatePath("/sales");
    revalidatePath("/payments");
    return { ok: true, message: "Demo data cleared successfully!" };
  } catch (error) {
    console.error("Clearing action failed:", error);
    return formError(
      error instanceof Error ? error.message : "Clearing failed.",
    );
  }
}
