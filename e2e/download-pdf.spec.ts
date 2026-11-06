import { test, expect } from "@playwright/test";

test.describe("Download Invoice as PDF", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#invoice-preview", { timeout: 15_000 });
  });

  // ── AC2: Button disabled before finalization ─────────────────
  test("AC2 — Download PDF button is disabled before finalization", async ({
    page,
  }) => {
    const downloadBtn = page.getByRole("button", { name: /Download PDF/i });
    await expect(downloadBtn).toBeVisible();
    await expect(downloadBtn).toBeDisabled();

    // Screenshot: disabled state
    await page.screenshot({
      path: "e2e/screenshots/download-pdf-disabled.png",
      fullPage: false,
    });
  });

  // ── AC1: Button enabled after finalization ───────────────────
  test("AC1 — Download PDF button becomes enabled after finalization", async ({
    page,
  }) => {
    // The Download PDF button should start disabled
    const downloadBtn = page.getByRole("button", { name: /Download PDF/i });
    await expect(downloadBtn).toBeDisabled();

    // Navigate to step 2 (Sender Details) and enter UPI ID
    await page.locator("button", { hasText: "2" }).click();
    const upiInput = page.locator('input[placeholder="yourname@upi"]');
    await upiInput.fill("test@upi");

    // Navigate to step 5 (Summary) and finalize
    await page.locator("button", { hasText: "5" }).click();
    await page.getByRole("button", { name: /Generate Invoice/i }).click();

    // Wait for finalization — the button text changes to "✓ Regenerate QR"
    await expect(
      page.getByRole("button", { name: /Regenerate QR/i })
    ).toBeVisible({ timeout: 10_000 });

    // Now the Download PDF button should be enabled
    await expect(downloadBtn).toBeEnabled({ timeout: 5_000 });

    // Screenshot: enabled state
    await page.screenshot({
      path: "e2e/screenshots/download-pdf-enabled.png",
      fullPage: false,
    });
  });

  // ── AC1: Download triggers with correct filename ─────────────
  test("AC1 — Clicking Download PDF triggers download with correct filename", async ({
    page,
  }) => {
    // Set a custom invoice ID first
    const invoiceIdInput = page.locator('input[placeholder="INV-001"]');
    await invoiceIdInput.clear();
    await invoiceIdInput.fill("INV-TEST-42");

    // Navigate to step 2 and enter UPI ID
    await page.locator("button", { hasText: "2" }).click();
    const upiInput = page.locator('input[placeholder="yourname@upi"]');
    await upiInput.fill("test@upi");

    // Navigate to step 5 and finalize
    await page.locator("button", { hasText: "5" }).click();
    await page.getByRole("button", { name: /Generate Invoice/i }).click();

    // Wait for finalization
    await expect(
      page.getByRole("button", { name: /Regenerate QR/i })
    ).toBeVisible({ timeout: 10_000 });

    // Set up download listener before clicking
    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });

    // Click the Download PDF button
    const downloadBtn = page.getByRole("button", { name: /Download PDF/i });
    await expect(downloadBtn).toBeEnabled();
    await downloadBtn.click();

    // Wait for the download event
    const download = await downloadPromise;

    // Verify the filename matches the invoice ID
    expect(download.suggestedFilename()).toBe("INV-TEST-42.pdf");
  });

  // ── AC1: Loading state during PDF generation ─────────────────
  test("AC1 — Button shows loading state during PDF generation", async ({
    page,
  }) => {
    // Navigate to step 2 and enter UPI ID
    await page.locator("button", { hasText: "2" }).click();
    const upiInput = page.locator('input[placeholder="yourname@upi"]');
    await upiInput.fill("test@upi");

    // Navigate to step 5 and finalize
    await page.locator("button", { hasText: "5" }).click();
    await page.getByRole("button", { name: /Generate Invoice/i }).click();

    // Wait for finalization
    await expect(
      page.getByRole("button", { name: /Regenerate QR/i })
    ).toBeVisible({ timeout: 10_000 });

    // Click the Download PDF button
    const downloadBtn = page.getByRole("button", { name: /Download PDF/i });
    await expect(downloadBtn).toBeEnabled();
    await downloadBtn.click();

    // The button should show "Generating PDF…" and be disabled during generation
    const generatingBtn = page.getByRole("button", {
      name: /Generating PDF/i,
    });
    await expect(generatingBtn).toBeVisible({ timeout: 5_000 });
    await expect(generatingBtn).toBeDisabled();

    // Verify aria-busy is set during generation
    await expect(generatingBtn).toHaveAttribute("aria-busy", "true");

    // Screenshot: loading state
    await page.screenshot({
      path: "e2e/screenshots/download-pdf-loading.png",
      fullPage: false,
    });

    // Wait for the download to complete — button reverts to "Download PDF"
    await expect(downloadBtn).toBeVisible({ timeout: 30_000 });
    await expect(downloadBtn).toBeEnabled();
  });
});
