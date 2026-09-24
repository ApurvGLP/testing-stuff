import { test, expect } from "@playwright/test";

test.describe("InvoicePreview Component", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/preview-test");
    // Wait for React to hydrate — the invoice-preview div must exist
    await page.waitForSelector("#invoice-preview", { timeout: 10_000 });
  });

  // ── AC2: Invoice meta bar ──────────────────────────────────
  test("AC2 — shows invoice number, issued date and due date in Indian locale", async ({
    page,
  }) => {
    const preview = page.locator("#invoice-preview").first();

    // Invoice number
    await expect(preview.getByText("INV-042")).toBeVisible();

    // Dates formatted d/m/yy (18/9/26 for 2026-09-18, 18/10/26 for 2026-10-18)
    await expect(preview.getByText("18/9/26")).toBeVisible();
    await expect(preview.getByText("18/10/26")).toBeVisible();
  });

  // ── AC3: From / Sender section ─────────────────────────────
  test("AC3 — From section shows sender name, email, phone, address and avatar initial", async ({
    page,
  }) => {
    const preview = page.locator("#invoice-preview").first();

    // Avatar shows 'A' for "Acme Corp"
    await expect(preview.locator(".rounded-full").first()).toContainText("A");

    // Details
    await expect(preview.getByText("Acme Corp")).toBeVisible();
    await expect(preview.getByText("billing@acme.com")).toBeVisible();
    await expect(preview.getByText("+91 98765 43210")).toBeVisible();
    await expect(preview.getByText("123 MG Road, Mumbai")).toBeVisible();
  });

  // ── AC4: To / Client section ───────────────────────────────
  test("AC4 — To section shows client name, email, phone, address and avatar initial", async ({
    page,
  }) => {
    const preview = page.locator("#invoice-preview").first();

    // The second avatar in the preview should show 'B' for "Beta Inc"
    const avatars = preview.locator(".rounded-full");
    await expect(avatars.nth(1)).toContainText("B");

    await expect(preview.getByText("Beta Inc")).toBeVisible();
    await expect(preview.getByText("accounts@beta.io")).toBeVisible();
    await expect(preview.getByText("+91 91234 56789")).toBeVisible();
    await expect(
      preview.getByText("456 Brigade Road, Bengaluru")
    ).toBeVisible();
  });

  // ── AC5: Line items table ──────────────────────────────────
  test("AC5 — line items table shows description, qty, price, amount in INR", async ({
    page,
  }) => {
    const preview = page.locator("#invoice-preview").first();

    // Header labels
    await expect(preview.getByText("Description")).toBeVisible();
    await expect(preview.getByText("Qty")).toBeVisible();
    await expect(preview.getByText("Price")).toBeVisible();
    await expect(preview.getByText("Amount")).toBeVisible();

    // First item: "Website Design", qty 1.00, price ₹50,000.00, amount ₹50,000.00
    await expect(preview.getByText("Website Design")).toBeVisible();
    await expect(preview.getByText("1.00")).toBeVisible();

    // Second item: "SEO Audit", qty 2, price ₹15,000.00
    await expect(preview.getByText("SEO Audit")).toBeVisible();

    // Third item has no description → should show "—"
    // The grid rows with "—" (at least one from the empty-description item)
    const dashTexts = preview.locator("p", { hasText: /^—$/ });
    await expect(dashTexts.first()).toBeVisible();
  });

  // ── AC6: Totals section with conditional discount/tax ──────
  test("AC6 — totals show subtotal, discount (10%), tax (18%), and bold total in INR", async ({
    page,
  }) => {
    const preview = page.locator("#invoice-preview").first();

    // Subtotal: 50000 + 30000 + 300 = 80300 → ₹80,300.00
    await expect(preview.getByText("Subtotal")).toBeVisible();
    await expect(preview.getByText("₹80,300.00")).toBeVisible();

    // Discount (10%): 80300 * 10% = 8030 → -₹8,030.00
    await expect(preview.getByText("Discount (10%)")).toBeVisible();
    await expect(preview.getByText("-₹8,030.00")).toBeVisible();

    // Tax (18%): (80300 - 8030) * 18% = 72270 * 0.18 = 13008.60 → ₹13,008.60
    await expect(preview.getByText("Tax (18%)")).toBeVisible();
    await expect(preview.getByText("₹13,008.60")).toBeVisible();

    // Total: 72270 + 13008.60 = 85278.60 → ₹85,278.60
    await expect(preview.getByText("₹85,278.60")).toBeVisible();
  });

  // ── AC7: QR shimmer placeholder ────────────────────────────
  test("AC7 — shows shimmer placeholder when UPI ID is set but not finalized", async ({
    page,
  }) => {
    const preview = page.locator("#invoice-preview").first();

    // "Pay via UPI" label
    await expect(preview.getByText("Pay via UPI")).toBeVisible();

    // UPI ID text
    await expect(preview.getByText("acme@upi")).toBeVisible();

    // The shimmer div should be present (not a real QR image)
    // The shimmer is a div with overflow-hidden + rounded-sm
    const shimmerBox = preview.locator(".h-24.w-24.overflow-hidden");
    await expect(shimmerBox).toBeVisible();
  });

  // ── Edge cases: empty data ─────────────────────────────────
  test("Empty data shows placeholders and hides optional sections", async ({
    page,
  }) => {
    const emptySection = page.locator("#empty-preview #invoice-preview");

    // Empty invoiceId → '000001'
    await expect(emptySection.getByText("000001")).toBeVisible();

    // Empty dates → '—'
    // Both issued and due date should show dashes
    const dashTexts = emptySection.locator("p", { hasText: /^—$/ });
    expect(await dashTexts.count()).toBeGreaterThanOrEqual(2);

    // Empty sender name → 'Your Name'
    await expect(emptySection.getByText("Your Name")).toBeVisible();

    // Empty client name → 'Client Name'
    await expect(emptySection.getByText("Client Name")).toBeVisible();

    // Avatar shows '?'
    const avatars = emptySection.locator(".rounded-full");
    await expect(avatars.first()).toContainText("?");

    // No discount row (discount = 0)
    await expect(
      emptySection.getByText(/Discount/)
    ).not.toBeVisible();

    // No tax row (taxRate = 0)
    await expect(
      emptySection.getByText(/^Tax/)
    ).not.toBeVisible();

    // No notes section
    await expect(
      emptySection.getByText("Note")
    ).not.toBeVisible();

    // No QR section (upiId empty)
    await expect(
      emptySection.getByText("Pay via UPI")
    ).not.toBeVisible();
  });

  // ── Finalized QR ───────────────────────────────────────────
  test("AC7 — shows real QR image when finalized", async ({ page }) => {
    const finalizedSection = page.locator(
      "#finalized-preview #invoice-preview"
    );

    // Should show the QR image, not the shimmer
    const qrImg = finalizedSection.locator('img[alt="UPI QR Code"]');
    await expect(qrImg).toBeVisible();

    // UPI ID text
    await expect(finalizedSection.getByText("seller@ybl")).toBeVisible();
  });

  // ── Screenshot of full preview ─────────────────────────────
  test("Visual snapshot — full preview with sample data", async ({ page }) => {
    const preview = page.locator("#invoice-preview").first();
    await expect(preview).toBeVisible();
    await page.screenshot({
      path: "e2e/screenshots/invoice-preview-full.png",
      fullPage: false,
    });
  });
});
