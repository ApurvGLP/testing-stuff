# Validation

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
