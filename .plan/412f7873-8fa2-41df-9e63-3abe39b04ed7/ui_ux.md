# UI/UX

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
