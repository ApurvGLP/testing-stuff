# Locked Decisions for Story 412f7873-8fa2-41df-9e63-3abe39b04ed7

## Implementation Approach
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

## UI/UX
## UI/UX: Download PDF Button — In-Context States

### Context
The download button already exists in `app/page.tsx` as an outline `Button` below the invoice preview panel (right column of a two-column layout). This story adds **loading feedback and error handling** to that button. No new screens, no new components, no layout changes.

### Page Context
The button sits directly below the dashed-border invoice preview card, in the sticky right-hand panel:

```
┌─────────────────────────────────────────┐
│  Invoice Preview (border-dashed card)   │
│  ┌───────────────────────────────────┐  │
│  │ Invoice No · Issued · Due Date   │  │
│  │ From / To                        │  │
│  │ Line Items Table                 │  │
│  │ Totals · QR Code                 │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [ ↓ Download PDF ]    ← this button    │
│    Error text here (when applicable)    │
└─────────────────────────────────────────┘
```

### Button States (4 total)

| State | Appearance | Trigger |
|-------|-----------|---------|
| **Disabled** | `opacity-50`, cursor not-allowed, no hover effect | Invoice not finalized (`!isFinalized`) |
| **Ready** | Normal outline button with Phosphor `Download` icon | Invoice finalized with QR code |
| **Downloading** | Phosphor `SpinnerGap` replaces `Download` icon (CSS spin animation), text becomes "Generating PDF…", button disabled | Click when ready — PDF generation takes 2-4s |
| **Error** | Button reverts to Ready; `text-destructive` message appears below for 5 seconds then auto-clears | html2canvas or jsPDF throws an error |

### Design Decisions
- **No toast library** — Button text changes to "Generating PDF…" during download, matching the existing "Generating…" pattern on the Generate Invoice button. No new dependencies.
- **Inline spinner** — `SpinnerGap` from `@phosphor-icons/react` (already installed) with a CSS `spin` animation. Replaces the `Download` icon during generation.
- **Temporary error text** — Below the button in `text-destructive` (OKLCH red), auto-clears after 5 seconds. Uses `role="alert"` for screen readers.
- **No success toast** — The browser's native download bar is sufficient confirmation.
- **Double-click prevention** — `isDownloading` state disables the button during generation.

### Component Reuse
- `Button` from `components/ui/button.tsx` — `variant="outline"`, `className="gap-2 rounded-none mt-4"`
- `Download` and `SpinnerGap` from `@phosphor-icons/react`
- OKLCH color tokens from `globals.css` (`--destructive` for error text)

### Accessibility
- `aria-disabled` when invoice is not finalized
- `aria-busy="true"` during PDF generation
- Error message wrapped in `role="alert"` for immediate screen reader announcement
- Button label text always describes current state (no icon-only states)
Artifacts: `artifacts/download_pdf_button_states.html`

## Validation
## Validation: Business Rules, Edge Cases & Error Handling

### Business Rules

| Rule | Implementation | Location |
|------|---------------|----------|
| **Invoice must be finalized before download** | Button `disabled={!isFinalized}` — already in place in `page.tsx` | `app/page.tsx` |
| **Finalization requires UPI ID** | `handleFinalize` guards on `!data.upiId` — already in place | `app/page.tsx` |
| **Filename must match invoice ID** | `pdf.save(\`${invoiceId || "invoice"}.pdf\`)` — already in place | `app/lib/download-invoice.ts` |

### Edge Cases to Handle

| Edge Case | Behavior | Priority |
|-----------|----------|----------|
| **`#invoice-preview` element not found** | `downloadInvoiceAsPDF` already throws `"Invoice preview element not found"`. The new try/catch in `page.tsx` will catch this and show the error message below the button. | Must have |
| **html2canvas rendering failure** | Can occur with CORS-blocked images or very large DOM. Caught by try/catch, error shown to user. Canvas cleanup ensures no memory leak. | Must have |
| **jsPDF creation/save failure** | Rare but possible (e.g., browser blocks the download). Caught by same try/catch. | Must have |
| **Very long invoice (many line items)** | The existing multi-page loop handles this correctly — tested with the `while (remainingHeight > 0)` loop. No change needed. | Already handled |
| **Empty invoice ID** | Fallback filename `"invoice.pdf"` via `invoiceId || "invoice"` — already in place. | Already handled |
| **Double-click prevention** | The `isDownloading` state disables the button during generation, preventing duplicate PDF requests. | Must have |
| **External logo images (CORS)** | `useCORS: true` in html2canvas config — already in place. If an image still fails CORS, html2canvas renders without it rather than throwing (graceful degradation). | Already handled |

### Error Messages

| Scenario | Message | Duration |
|----------|---------|----------|
| Canvas/PDF generation failure | "PDF generation failed. Please try again." | 5 seconds, auto-dismiss |
| Preview element missing | "PDF generation failed. Please try again." | 5 seconds, auto-dismiss |

A single generic error message is used for all failure modes. Users cannot act on technical details ("canvas rendering failed" vs "jsPDF error"), so a generic message with retry guidance is more helpful. The actual error is logged to `console.error` for debugging.

### What Does NOT Need Validation
- **Invoice content completeness** — The PDF captures whatever is displayed in the preview. Empty fields show placeholder text ("Your Name", "Client Name") which is the same UX as the live preview. No separate validation gate before download.
- **PDF file size limits** — html2canvas at 3× scale produces predictable file sizes (typically 200KB–2MB). No risk of browser crashes or download failures.
- **Browser compatibility** — html2canvas-pro and jsPDF support all modern browsers. No polyfills needed for the target audience.
