# UI/UX

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
