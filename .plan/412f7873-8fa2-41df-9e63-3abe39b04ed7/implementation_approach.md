# Implementation Approach

## Implementation Approach: Harden Existing Client-Side PDF Generation

### Current State
The core feature is **already implemented** in the destination codebase:
- `app/lib/download-invoice.ts` — `downloadInvoiceAsPDF()` using `html2canvas-pro` (3× scale) + `jsPDF` (A4 portrait, multi-page splitting)
- `app/page.tsx` — Download PDF button wired with `disabled={!isFinalized}` guard
- `components/invoice/invoice-preview.tsx` — The `#invoice-preview` DOM element captured by html2canvas
- Both `html2canvas-pro` and `jspdf` packages are in `package.json`

### What Needs to Change (3 improvements)

#### 1. Dynamic Imports for Bundle Optimization
**Current:** `html2canvas-pro` (~200KB) and `jspdf` (~280KB) are imported statically at the top of `download-invoice.ts`, inflating the initial JS bundle.
**Change:** Convert to `await import()` inside `downloadInvoiceAsPDF()` so they're only loaded when the user clicks "Download PDF". This aligns with the locked NFR target of < 150KB gzipped initial load.

```typescript
// Before (static)
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

// After (dynamic)
const html2canvas = (await import("html2canvas-pro")).default;
const jsPDF = (await import("jspdf")).default;
```

#### 2. Loading State + Error Handling
**Current:** The button click handler `() => downloadInvoiceAsPDF(invoiceData.invoiceId)` in `page.tsx` has:
- No `try/catch` — errors silently fail
- No loading indicator — PDF generation takes 2-4 seconds at 3× scale with no user feedback
- No success/failure notification

**Change:** Add `isDownloading` state to the page, wrap the call in try/catch, show a spinner on the button during generation, and display a brief inline error message if it fails. No toast library needed — the button itself changes state (matches the existing pattern where "Generate Invoice" shows "Generating…").

#### 3. Defensive Guard in Multi-Page Logic
**Current:** The multi-page splitting loop works but could produce an extra blank page at the boundary when `imgHeight` is exactly equal to `pdfHeight` (already handled by `<=` check — this is fine). Add a guard to skip `addPage()` when `remainingHeight` is ≤ 0 after subtraction, and ensure the canvas is cleaned up after use to free memory.

### What Does NOT Change
- The core `html2canvas-pro` + `jsPDF` approach — it's the locked technology choice
- The `#invoice-preview` capture target
- The 3× scale factor
- The A4 portrait format
- The multi-page splitting algorithm
- The filename pattern (`{invoiceId}.pdf`)
- The `InvoicePreview` component (it already renders all required content: sender/client info, line items, financial totals, QR code)

### File Changes
| File | Change |
|------|--------|
| `app/lib/download-invoice.ts` | Dynamic imports, memory cleanup, return status |
| `app/page.tsx` | Add `isDownloading` state, try/catch, loading/error feedback on button |

### Testing Approach
- **Unit test:** Verify `downloadInvoiceAsPDF` rejects gracefully when `#invoice-preview` element is missing (Vitest + jsdom)
- **E2E test:** Playwright test that completes the invoice wizard, finalizes with QR, clicks Download PDF, and verifies a `.pdf` file is downloaded with the correct filename
