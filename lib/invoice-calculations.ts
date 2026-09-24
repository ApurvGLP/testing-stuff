import type { InvoiceData } from "@/app/types/invoice-types";

export interface InvoiceFinancials {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
}

/**
 * Single source of truth for all invoice financial computations.
 *
 * Calculation order:
 *   subtotal        = Σ (qty × rate)  for every line item
 *   discountAmount  = subtotal × discount / 100
 *   taxableAmount   = subtotal − discountAmount
 *   taxAmount       = taxableAmount × taxRate / 100
 *   total           = taxableAmount + taxAmount
 *
 * Every intermediate value is rounded to 2 decimal places via
 * Math.round(n * 100) / 100 to avoid floating-point drift.
 */
export function calculateInvoiceFinancials(
  data: Pick<InvoiceData, "lineItems" | "discount" | "taxRate">,
): InvoiceFinancials {
  const round2 = (n: number): number => Math.round(n * 100) / 100;

  const subtotal = round2(
    data.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0,
    ),
  );

  const discountAmount = round2((subtotal * data.discount) / 100);
  const taxableAmount = round2(subtotal - discountAmount);
  const taxAmount = round2((taxableAmount * data.taxRate) / 100);
  const total = round2(taxableAmount + taxAmount);

  return { subtotal, discountAmount, taxableAmount, taxAmount, total };
}

/**
 * Format a number in INR (Indian Rupee) with Indian locale grouping.
 *
 * Uses ₹ (Unicode), en-IN locale (Indian grouping: 1,00,000),
 * and always 2 decimal places.
 *
 * Examples: ₹1,500.00 · ₹10,00,000.00 · ₹0.00
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
