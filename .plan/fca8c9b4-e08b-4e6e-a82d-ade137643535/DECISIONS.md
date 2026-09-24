# Locked Decisions for Story fca8c9b4-e08b-4e6e-a82d-ade137643535

## Implementation Approach
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

## UI/UX
## UI/UX: Two-Column Form + Live Preview Layout

### Layout Architecture
The page uses a **responsive two-column grid** (`grid-cols-1 lg:grid-cols-2`) within a max-width `7xl` container:

- **Left column** — 5-step wizard form with animated step transitions (Motion/Framer Motion). Steps: Invoice Details → Sender → Client → Line Items → Summary
- **Right column** — Sticky invoice preview panel (`sticky top-8 h-fit`) wrapped in a `border-dashed` card. This is the primary deliverable of this story.

### Preview Panel Sections (top to bottom)
1. **Invoice Meta Bar** — Invoice number (left), Issued date + Due date (right). Dates formatted `dd/mm/yy` via `toLocaleDateString('en-IN')`.
2. **From / To Grid** — Two-column split. From shows sender logo (uploaded image) or Avatar (gray circle with initial). To always shows Avatar. Both sections display name (bold, 2xl), email, phone, address.
3. **Line Items Table** — 12-column CSS grid header (Description 6-col, Qty 2-col, Price 2-col, Amount 2-col) + rows for each item. Amounts in `₹` INR format.
4. **Bottom Section** — Left side: Notes text + QR code area (shimmer placeholder or real QR). Right side: Totals stack (Subtotal, Discount if >0%, Tax if >0%, bold Total).

### Design Language (matches locked UI Framework decision)
- **White background** on preview (`bg-white text-gray-900`) — intentionally ignores the app's dark/light theme to simulate a printed document
- **Font**: DM Sans / Inter for the invoice preview (document aesthetic), vs JetBrains Mono for the app UI
- **Dashed borders** on the outer preview container (`border border-dashed border-border bg-card p-8`)
- **OKLCH color system** for the surrounding UI (form, navigation, header)
- **Signature elements**: `rounded-none` buttons, dashed step indicators, uppercase tracking-widest labels

### Interactions
- **Immediate reactivity** — Every keystroke in the form triggers a React state update; the preview re-renders with no debounce (state is lifted to `page.tsx`)
- **Sticky scrolling** — Preview stays in viewport while user scrolls through form steps
- **Step navigation** — Animated slide transitions via Motion; clickable step numbers allow jumping between steps
- **Finalization reset** — Editing any field after invoice generation resets the QR code back to shimmer state

### Responsive Behavior
- **≥ 1024px (lg+)** — Side-by-side columns, preview is sticky
- **< 1024px** — Single column stack, preview below the form (not sticky)

### Existing Components Reused
- `Card` from `components/ui/card.tsx` — preview container
- `Button` from `components/ui/button.tsx` — navigation buttons
- `Input` from `components/ui/input.tsx` — all form fields
- `Textarea` from `components/ui/textarea.tsx` — address, notes
- `Kbd` from `components/ui/kbd.tsx` — theme toggle hint
- `ThemeProvider` from `components/theme-provider.tsx` — dark/light mode
Artifacts: `artifacts/live_invoice_preview.html`

## Validation
## Validation & Edge Cases for the Live Preview

This story's preview component is **display-only** — it renders whatever data the form provides. Validation of inputs happens in the form steps (separate story concern). However, the preview must handle edge cases gracefully:

### Display Edge Cases

| Scenario | Expected Behavior | Implementation |
|---|---|---|
| **Empty name fields** | Show placeholder text: 'Your Name' for sender, 'Client Name' for client | Conditional `\|\|` fallback in JSX |
| **Empty invoice ID** | Show '000001' as default | `data.invoiceId \|\| '000001'` |
| **No date entered** | Show '—' dash | Conditional check before `toLocaleDateString` |
| **No line items** | Empty table body (no rows) | `.map()` over empty array = nothing rendered |
| **Line item with empty description** | Show '—' dash | `item.description \|\| '—'` |
| **Zero quantity/rate** | Show ₹0.00 amounts | `toLocaleString('en-IN')` handles zero correctly |
| **0% discount** | Hide the discount row entirely | `{data.discount > 0 && (...)}` conditional |
| **0% tax rate** | Hide the tax row entirely | `{data.taxRate > 0 && (...)}` conditional |
| **No UPI ID** | Hide the entire QR section | `{data.upiId && (...)}` conditional |
| **No notes** | Hide the notes section | `{data.notes && (...)}` conditional |
| **Very long names/addresses** | Text wraps naturally | CSS `leading-relaxed`, no `truncate` |
| **Many line items** | Preview grows vertically | No max-height on preview; scrollable form already has `max-h-96` on items list |

### Number Formatting Rules (INR — Indian Locale)
- **Currency symbol**: `₹` prefix (Unicode ₹, not `Rs.`)
- **Locale**: `en-IN` — uses Indian grouping (1,00,000 not 100,000)
- **Decimal places**: Always 2 (`minimumFractionDigits: 2`)
- **Examples**: ₹1,500.00 · ₹10,00,000.00 · ₹0.00

### Date Formatting Rules
- **Locale**: `en-IN` with `{ day: 'numeric', month: 'numeric', year: '2-digit' }`
- **Output format**: `d/m/yy` (e.g., 18/9/26 for September 18, 2026)
- **Invalid/empty dates**: Show '—' dash

### Financial Calculation Integrity
The preview uses `calculateInvoiceFinancials()` from `@invoice/shared` — the **same function** used by the Summary form step and the backend. This guarantees:
- Preview totals always match the Summary step
- Each intermediate value rounded to 2 decimal places (`Math.round(n * 100) / 100`)
- Calculation order: subtotal → discount → taxable → tax → total
- No floating-point drift between display contexts

### Avatar Behavior
- Shows the **first character** of the name, uppercased
- Falls back to `?` when name is empty or whitespace-only
- Sender: avatar is replaced by `<img>` if `senderLogo` is set (base64 data URL from file upload)
- Client: always avatar (no logo upload for clients)

### QR Code Shimmer
- **Shown when**: `data.upiId` is truthy AND `isFinalized` is false (or `qrDataUrl` is undefined)
- **Replaced when**: `isFinalized === true && qrDataUrl` is a valid base64 image URL
- **Reset**: Any edit after finalization resets `isFinalized` to false, shimmer returns
- **Animation**: CSS `@keyframes shimmer` — 1.6s infinite horizontal sweep over a dot-grid background
