"use client";

import { useActionState } from "react";
import { useState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { recordPayment } from "@/lib/actions";

type CustomerDebt = {
  customer_id: string;
  name: string | null;
  business_name: string | null;
  outstanding_balance: number | string;
};

type OpenSale = {
  sale_id: string;
  customer_id: string;
  balance: number | string;
};

export function PaymentForm({
  customers,
  openSales,
  selectedCustomerId
}: {
  customers: CustomerDebt[];
  openSales: OpenSale[];
  selectedCustomerId?: string;
}) {
  const [state, formAction] = useActionState(recordPayment, null);
  const [customerId, setCustomerId] = useState(selectedCustomerId ?? "");
  const today = new Date().toISOString().slice(0, 10);
  const visibleSales = openSales.filter((sale) => !customerId || sale.customer_id === customerId);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2" id="record-payment">
      <label className="field">
        Customer
        <select className="input" name="customer_id" onChange={(event) => setCustomerId(event.target.value)} required value={customerId}>
          <option value="">Select customer</option>
          {customers.map((customer) => (
            <option key={customer.customer_id} value={customer.customer_id}>
              {customer.name} {customer.business_name ? `- ${customer.business_name}` : ""} ({customer.outstanding_balance} ETB)
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        Sale
        <select className="input" name="sale_id">
          <option value="">Oldest debt first</option>
          {visibleSales.map((sale) => (
            <option key={sale.sale_id} value={sale.sale_id}>
              {sale.sale_id.slice(0, 8)} - {sale.balance} ETB
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        Amount
        <input className="input" min="0.01" name="amount" required step="0.01" type="number" />
      </label>

      <label className="field">
        Payment date
        <input className="input" defaultValue={today} name="payment_date" required type="date" />
      </label>

      <label className="field sm:col-span-2">
        Note
        <textarea className="textarea" name="note" placeholder="Optional note" />
      </label>

      <div className="flex items-center gap-3 sm:col-span-2">
        <SubmitButton>Record Payment</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
