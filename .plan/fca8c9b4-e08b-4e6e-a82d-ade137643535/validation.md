# Validation

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
