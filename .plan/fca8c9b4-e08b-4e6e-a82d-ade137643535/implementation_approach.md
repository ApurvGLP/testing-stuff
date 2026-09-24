# Implementation Approach

## Implementation: Verify & Polish Existing InvoicePreview Component

### Current State — Nearly Complete
The destination codebase already has a working implementation that covers **all 7 acceptance criteria**:

| AC | Requirement | Status | Where |
|---|---|---|---|
| 1 | Real-time preview updates on any field change | ✅ Done | `page.tsx` lifts state via `useState<InvoiceData>`, passes to both `InvoiceForm` and `InvoicePreview` |
| 2 | Invoice number, dates in Indian locale (dd/mm/yy) | ✅ Done | `invoice-preview.tsx` uses `toLocaleDateString('en-IN', { day:'numeric', month:'numeric', year:'2-digit' })` |
| 3 | From section: name/email/phone/address + logo or avatar | ✅ Done | `Avatar` component shows initial; conditional `<img>` for `senderLogo`; 'Your Name' placeholder |
| 4 | To section: name/email/phone/address + avatar | ✅ Done | `Avatar` component with initial; 'Client Name' placeholder |
| 5 | Line items table with description/qty/price/amount | ✅ Done | 12-column grid with INR formatting via `toLocaleString('en-IN')` |
| 6 | Totals: subtotal, discount (if >0%), tax (if >0%), bold total in INR | ✅ Done | Uses `calculateInvoiceFinancials()` from `@invoice/shared`; conditional rendering for discount/tax rows |
| 7 | QR shimmer placeholder when UPI ID entered but not finalized | ✅ Done | Dot-grid + CSS `@keyframes shimmer` animation; switches to real QR when `isFinalized && qrDataUrl` |

### Key Architecture Patterns Already In Place
- **Shared calculations** — `calculateInvoiceFinancials()` from `@invoice/shared` is the single source of truth for subtotal, discount, tax, and total (used by both `InvoicePreview` and `InvoiceSummary` step)
- **State lifting** — `page.tsx` owns `invoiceData` state; form steps call `onChange` → parent re-renders → preview updates immediately (React's standard unidirectional flow)
- **Finalization reset** — `handleChange` in `page.tsx` resets `isFinalized` and `qrDataUrl` when any field changes post-finalization, ensuring the shimmer returns if the user edits after generating
- **Sticky preview** — Preview panel is `sticky top-8 h-fit` so it stays visible while scrolling through form steps
- **Preview always uses white background** — `bg-white text-gray-900` with `fontFamily: 'DM Sans', 'Inter', sans-serif'` — intentionally separate from the app's dark/light theme so the preview looks like the actual printed document

### Remaining Work — Minor Polish
1. **Add missing Download PDF button** — The source app shows a Download PDF button below the preview (disabled until finalized). The destination `page.tsx` is missing this. However, this may belong to the "Invoice PDF Generation" story rather than this one.
2. **Verify `@invoice/shared` build** — Ensure the shared package's `dist/` is up to date so `calculateInvoiceFinancials` resolves at runtime.
3. **Test responsive behavior** — On mobile (`< lg` breakpoint), the two-column layout collapses to single column. The preview should stack below the form. Already handled by `grid-cols-1 lg:grid-cols-2` in `page.tsx`.

### No New Components Needed
All components are already in place:
- `InvoicePreview` — `frontend/components/invoice/invoice-preview.tsx`
- `InvoiceForm` — `frontend/components/invoice/invoice-form.tsx`
- Step components — `steps/invoice-details.tsx`, `sender-details.tsx`, `client-details.tsx`, `line-items.tsx`, `invoice-summary.tsx`
- UI primitives — `Button`, `Card`, `Input`, `Textarea`, `Kbd` from `components/ui/`
- `Avatar` — inline in `invoice-preview.tsx` (private helper)

### Testing Approach
- **Unit tests** for `calculateInvoiceFinancials` — verify subtotal, discount, tax, total for various inputs including edge cases (zero items, 100% discount, 0% tax)
- **Component tests** for `InvoicePreview` — render with sample `InvoiceData`, assert date formatting, INR formatting, conditional discount/tax rows, shimmer presence
- **E2E** — Fill in a form field, assert the preview panel text updates (covered by the broader wizard E2E flow)
