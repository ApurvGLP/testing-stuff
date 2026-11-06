import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateInvoiceFinancials, formatINR } from "../../lib/invoice-calculations.ts";

/**
 * Unit tests for lib/invoice-calculations.ts
 *
 * These are pure functions with no external dependencies — no mocking needed.
 *
 * Calculation order (from the source):
 *   subtotal       = Σ (qty × rate)
 *   discountAmount = subtotal × discount / 100
 *   taxableAmount  = subtotal − discountAmount
 *   taxAmount      = taxableAmount × taxRate / 100
 *   total          = taxableAmount + taxAmount
 *
 * Every intermediate value is rounded to 2 decimal places.
 */

describe("calculateInvoiceFinancials", () => {
  it("basic calculation: 2 line items, 10% discount, 18% tax", () => {
    const result = calculateInvoiceFinancials({
      lineItems: [
        { id: "1", description: "Web Development", quantity: 10, rate: 100 },
        { id: "2", description: "Design", quantity: 5, rate: 200 },
      ],
      discount: 10,
      taxRate: 18,
    });

    // subtotal = (10×100) + (5×200) = 1000 + 1000 = 2000
    // discountAmount = 2000 × 10/100 = 200
    // taxableAmount = 2000 − 200 = 1800
    // taxAmount = 1800 × 18/100 = 324
    // total = 1800 + 324 = 2124
    assert.strictEqual(result.subtotal, 2000);
    assert.strictEqual(result.discountAmount, 200);
    assert.strictEqual(result.taxableAmount, 1800);
    assert.strictEqual(result.taxAmount, 324);
    assert.strictEqual(result.total, 2124);
  });

  it("zero discount and zero tax", () => {
    const result = calculateInvoiceFinancials({
      lineItems: [
        { id: "1", description: "Consulting", quantity: 8, rate: 150 },
      ],
      discount: 0,
      taxRate: 0,
    });

    // subtotal = 8 × 150 = 1200
    // discountAmount = 0
    // taxableAmount = 1200
    // taxAmount = 0
    // total = 1200
    assert.strictEqual(result.subtotal, 1200);
    assert.strictEqual(result.discountAmount, 0);
    assert.strictEqual(result.taxableAmount, 1200);
    assert.strictEqual(result.taxAmount, 0);
    assert.strictEqual(result.total, 1200);
  });

  it("single line item", () => {
    const result = calculateInvoiceFinancials({
      lineItems: [
        { id: "1", description: "Logo Design", quantity: 1, rate: 5000 },
      ],
      discount: 5,
      taxRate: 12,
    });

    // subtotal = 1 × 5000 = 5000
    // discountAmount = 5000 × 5/100 = 250
    // taxableAmount = 5000 − 250 = 4750
    // taxAmount = 4750 × 12/100 = 570
    // total = 4750 + 570 = 5320
    assert.strictEqual(result.subtotal, 5000);
    assert.strictEqual(result.discountAmount, 250);
    assert.strictEqual(result.taxableAmount, 4750);
    assert.strictEqual(result.taxAmount, 570);
    assert.strictEqual(result.total, 5320);
  });

  it("handles rounding for floating-point values (quantity=3, rate=0.1)", () => {
    const result = calculateInvoiceFinancials({
      lineItems: [
        { id: "1", description: "Micro-transaction", quantity: 3, rate: 0.1 },
      ],
      discount: 0,
      taxRate: 18,
    });

    // subtotal = 3 × 0.1 = 0.30000000000000004 → rounded to 0.30
    // discountAmount = 0
    // taxableAmount = 0.30
    // taxAmount = 0.30 × 18/100 = 0.054 → rounded to 0.05
    // total = 0.30 + 0.05 = 0.35
    assert.strictEqual(result.subtotal, 0.3);
    assert.strictEqual(result.discountAmount, 0);
    assert.strictEqual(result.taxableAmount, 0.3);
    assert.strictEqual(result.taxAmount, 0.05);
    assert.strictEqual(result.total, 0.35);
  });

  it("rounding: values that produce long decimals", () => {
    const result = calculateInvoiceFinancials({
      lineItems: [
        { id: "1", description: "Service A", quantity: 1, rate: 100 },
        { id: "2", description: "Service B", quantity: 1, rate: 200 },
      ],
      discount: 15,
      taxRate: 7.5,
    });

    // subtotal = 300
    // discountAmount = 300 × 15/100 = 45
    // taxableAmount = 300 − 45 = 255
    // taxAmount = 255 × 7.5/100 = 19.125 → rounded to 19.13
    // total = 255 + 19.13 = 274.13
    assert.strictEqual(result.subtotal, 300);
    assert.strictEqual(result.discountAmount, 45);
    assert.strictEqual(result.taxableAmount, 255);
    assert.strictEqual(result.taxAmount, 19.13);
    assert.strictEqual(result.total, 274.13);
  });

  it("100% discount results in zero total", () => {
    const result = calculateInvoiceFinancials({
      lineItems: [
        { id: "1", description: "Free Trial", quantity: 1, rate: 500 },
      ],
      discount: 100,
      taxRate: 18,
    });

    // subtotal = 500
    // discountAmount = 500
    // taxableAmount = 0
    // taxAmount = 0
    // total = 0
    assert.strictEqual(result.subtotal, 500);
    assert.strictEqual(result.discountAmount, 500);
    assert.strictEqual(result.taxableAmount, 0);
    assert.strictEqual(result.taxAmount, 0);
    assert.strictEqual(result.total, 0);
  });

  it("multiple line items with varying quantities and rates", () => {
    const result = calculateInvoiceFinancials({
      lineItems: [
        { id: "1", description: "Development", quantity: 40, rate: 75 },
        { id: "2", description: "QA", quantity: 20, rate: 50 },
        { id: "3", description: "Design", quantity: 15, rate: 80 },
      ],
      discount: 5,
      taxRate: 18,
    });

    // subtotal = (40×75) + (20×50) + (15×80) = 3000 + 1000 + 1200 = 5200
    // discountAmount = 5200 × 5/100 = 260
    // taxableAmount = 5200 − 260 = 4940
    // taxAmount = 4940 × 18/100 = 889.20
    // total = 4940 + 889.20 = 5829.20
    assert.strictEqual(result.subtotal, 5200);
    assert.strictEqual(result.discountAmount, 260);
    assert.strictEqual(result.taxableAmount, 4940);
    assert.strictEqual(result.taxAmount, 889.2);
    assert.strictEqual(result.total, 5829.2);
  });

  it("empty line items array results in all zeros", () => {
    const result = calculateInvoiceFinancials({
      lineItems: [],
      discount: 10,
      taxRate: 18,
    });

    assert.strictEqual(result.subtotal, 0);
    assert.strictEqual(result.discountAmount, 0);
    assert.strictEqual(result.taxableAmount, 0);
    assert.strictEqual(result.taxAmount, 0);
    assert.strictEqual(result.total, 0);
  });
});

describe("formatINR", () => {
  it("formats basic amount: 1500 → ₹1,500.00", () => {
    assert.strictEqual(formatINR(1500), "₹1,500.00");
  });

  it("formats zero: 0 → ₹0.00", () => {
    assert.strictEqual(formatINR(0), "₹0.00");
  });

  it("formats large amount with Indian grouping: 100000 → ₹1,00,000.00", () => {
    assert.strictEqual(formatINR(100000), "₹1,00,000.00");
  });

  it("formats decimal amount: 1234.56 → ₹1,234.56", () => {
    assert.strictEqual(formatINR(1234.56), "₹1,234.56");
  });

  it("formats very large amount: 10000000 → ₹1,00,00,000.00", () => {
    assert.strictEqual(formatINR(10000000), "₹1,00,00,000.00");
  });
});
