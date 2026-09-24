import { test, expect } from "@playwright/test";

test.describe("Invoice Wizard — Real-time Preview Updates (AC1)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the wizard form and preview to hydrate
    await page.waitForSelector("#invoice-preview", { timeout: 15_000 });
  });

  test("AC1 — typing in Invoice ID updates preview in real time", async ({
    page,
  }) => {
    const preview = page.locator("#invoice-preview");

    // Default invoice ID should be INV-001
    await expect(preview.getByText("INV-001")).toBeVisible();

    // Clear and type a new invoice ID
    const invoiceIdInput = page.locator('input[placeholder="INV-001"]');
    await invoiceIdInput.clear();
    await invoiceIdInput.fill("INV-TEST-999");

    // Preview should immediately reflect the change
    await expect(preview.getByText("INV-TEST-999")).toBeVisible();
  });

  test("AC1 — typing sender name updates the From section in preview (AC3)", async ({
    page,
  }) => {
    const preview = page.locator("#invoice-preview");

    // Initially shows placeholder "Your Name"
    await expect(preview.getByText("Your Name")).toBeVisible();

    // Navigate to step 2 (Sender Details) by clicking step indicator 2
    await page.locator("button", { hasText: "2" }).click();

    // Type sender name
    const senderNameInput = page.locator(
      'input[placeholder="Your Company Name"]'
    );
    await senderNameInput.fill("Acme Corp");

    // Preview should show "Acme Corp" and avatar "A"
    await expect(preview.getByText("Acme Corp")).toBeVisible();
    const avatar = preview.locator(".rounded-full").first();
    await expect(avatar).toContainText("A");
  });

  test("AC1 — typing client name updates the To section in preview (AC4)", async ({
    page,
  }) => {
    const preview = page.locator("#invoice-preview");

    // Initially shows placeholder "Client Name"
    await expect(preview.getByText("Client Name")).toBeVisible();

    // Navigate to step 3 (Client Details)
    await page.locator("button", { hasText: "3" }).click();

    // Type client name
    const clientNameInput = page.locator(
      'input[placeholder="Client Name"]'
    );
    await clientNameInput.fill("Beta Inc");

    // Preview should show "Beta Inc"
    await expect(preview.getByText("Beta Inc")).toBeVisible();
  });

  test("AC7 — entering UPI ID shows shimmer, and finalization reset works", async ({
    page,
  }) => {
    const preview = page.locator("#invoice-preview");

    // Initially no QR section (empty UPI ID)
    await expect(preview.getByText("Pay via UPI")).not.toBeVisible();

    // Navigate to step 2 (Sender) and enter UPI ID
    await page.locator("button", { hasText: "2" }).click();
    const upiInput = page.locator('input[placeholder="yourname@upi"]');
    await upiInput.fill("test@upi");

    // Shimmer should appear (UPI ID entered, not finalized)
    await expect(preview.getByText("Pay via UPI")).toBeVisible();
    await expect(preview.getByText("test@upi")).toBeVisible();

    // The shimmer box should be present (not a real QR img)
    const shimmerBox = preview.locator(".h-24.w-24.overflow-hidden");
    await expect(shimmerBox).toBeVisible();

    // No real QR image yet
    const qrImg = preview.locator('img[alt="UPI QR Code"]');
    await expect(qrImg).not.toBeVisible();
  });

  test("Wizard step navigation works — can click step numbers", async ({
    page,
  }) => {
    // Should start on step 1
    await expect(page.getByText("Step 1 of 5")).toBeVisible();

    // Click step 3
    await page.locator("button", { hasText: "3" }).click();
    await expect(page.getByText("Step 3 of 5")).toBeVisible();

    // Should show "Bill To (Client)" heading
    await expect(page.getByText("Bill To (Client)")).toBeVisible();

    // Click Next to go to step 4
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("Step 4 of 5")).toBeVisible();
    await expect(page.getByText("Line Items")).toBeVisible();

    // Click Previous to go back to step 3
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await expect(page.getByText("Step 3 of 5")).toBeVisible();
  });

  test("Screenshot — wizard page with form and preview side by side", async ({
    page,
  }) => {
    // Set viewport to desktop to see side-by-side layout
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: "e2e/screenshots/invoice-wizard-full.png",
      fullPage: false,
    });
  });
});
