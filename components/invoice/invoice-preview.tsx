"use client";

import type { InvoiceData } from "@/app/types/invoice-types";
import {
  calculateInvoiceFinancials,
  formatINR,
} from "@/lib/invoice-calculations";

interface InvoicePreviewProps {
  data: InvoiceData;
  isFinalized?: boolean;
  qrDataUrl?: string;
}

/** Private Avatar helper — shows the first letter of `name`, or "?" when empty. */
function Avatar({ name }: { name: string }) {
  const initial = name?.trim()?.[0]?.toUpperCase() || "?";
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-lg font-semibold text-gray-500">
      {initial}
    </div>
  );
}

/**
 * Formats a date string (YYYY-MM-DD) into Indian locale dd/mm/yy.
 * Returns "—" for falsy or invalid values.
 */
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "2-digit",
  });
}

export function InvoicePreview({
  data,
  isFinalized = false,
  qrDataUrl,
}: InvoicePreviewProps) {
  const { subtotal, discountAmount, taxAmount, total } =
    calculateInvoiceFinancials(data);

  return (
    <div
      id="invoice-preview"
      className="w-full bg-white text-gray-900 font-sans text-sm"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      {/* ── Invoice Meta Bar (AC2) ──────────────────────────── */}
      <div className="flex items-start justify-between px-8 py-6 border-b border-gray-200">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
            Invoice No
          </p>
          <p className="text-base font-semibold text-gray-900">
            {data.invoiceId || "000001"}
          </p>
        </div>
        <div className="flex gap-10 text-right">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
              Issued
            </p>
            <p className="text-base font-semibold text-gray-900">
              {formatDate(data.invoiceDate)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
              Due Date
            </p>
            <p className="text-base font-semibold text-gray-900">
              {formatDate(data.dueDate)}
            </p>
          </div>
        </div>
      </div>

      {/* ── From / To (AC3, AC4) ───────────────────────────── */}
      <div className="grid grid-cols-2 border-b border-gray-200">
        {/* FROM */}
        <div className="px-8 py-6 border-r border-gray-200">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">
            From
          </p>
          {data.senderLogo ? (
            <img
              src={data.senderLogo}
              alt="Logo"
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <Avatar name={data.senderName} />
          )}
          <h2 className="mt-3 text-2xl font-bold text-gray-900 leading-tight">
            {data.senderName || "Your Name"}
          </h2>
          <p className="text-gray-400 text-sm mt-1">{data.senderEmail}</p>
          {data.senderAddress && (
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              {data.senderAddress}
            </p>
          )}
          {data.senderPhone && (
            <p className="text-gray-400 text-sm mt-1">{data.senderPhone}</p>
          )}
        </div>

        {/* TO */}
        <div className="px-8 py-6">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">
            To
          </p>
          <Avatar name={data.clientName} />
          <h2 className="mt-3 text-2xl font-bold text-gray-900 leading-tight">
            {data.clientName || "Client Name"}
          </h2>
          <p className="text-gray-400 text-sm mt-1">{data.clientEmail}</p>
          {data.clientAddress && (
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              {data.clientAddress}
            </p>
          )}
          {data.clientPhone && (
            <p className="text-gray-400 text-sm mt-1">{data.clientPhone}</p>
          )}
        </div>
      </div>

      {/* ── Line Items Table (AC5) ─────────────────────────── */}
      <div className="px-8 py-6 border-b border-gray-200">
        {/* Header */}
        <div className="grid grid-cols-12 pb-3 border-b border-gray-200">
          <p className="col-span-6 text-xs uppercase tracking-widest text-gray-400">
            Description
          </p>
          <p className="col-span-2 text-xs uppercase tracking-widest text-gray-400 text-right">
            Qty
          </p>
          <p className="col-span-2 text-xs uppercase tracking-widest text-gray-400 text-right">
            Price
          </p>
          <p className="col-span-2 text-xs uppercase tracking-widest text-gray-400 text-right">
            Amount
          </p>
        </div>

        {/* Rows */}
        {data.lineItems.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-12 py-4 border-b border-gray-100 items-center"
          >
            <p className="col-span-6 font-semibold text-gray-900">
              {item.description || "—"}
            </p>
            <p className="col-span-2 text-right text-gray-500">
              {item.quantity.toFixed(2)}
            </p>
            <p className="col-span-2 text-right text-gray-500">
              {formatINR(item.rate)}
            </p>
            <p className="col-span-2 text-right font-semibold text-gray-900">
              {formatINR(item.quantity * item.rate)}
            </p>
          </div>
        ))}
      </div>

      {/* ── Totals + Notes + QR (AC6, AC7) ─────────────────── */}
      <div className="grid grid-cols-2 px-8 py-6 gap-8">
        {/* Left: Notes + QR */}
        <div className="flex flex-col justify-between gap-6">
          {data.notes && (
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                Note
              </p>
              <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
                {data.notes}
              </p>
            </div>
          )}

          {/* QR Code shimmer / real QR (AC7) */}
          {data.upiId && (
            <div className="flex flex-col items-start gap-2 mt-auto">
              <p className="text-xs uppercase tracking-widest text-gray-400">
                Pay via UPI
              </p>
              <div className="relative">
                {isFinalized && qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="UPI QR Code"
                    className="h-24 w-24"
                  />
                ) : (
                  <div className="h-24 w-24 overflow-hidden rounded-sm relative">
                    {/* Dot-grid background */}
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
                        backgroundSize: "6px 6px",
                      }}
                    />
                    {/* Shimmer sweep */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.6s infinite",
                      }}
                    />
                    <style>{`
                      @keyframes shimmer {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                      }
                    `}</style>
                  </div>
                )}
              </div>
              <p className="text-xs font-mono text-gray-500">{data.upiId}</p>
            </div>
          )}
        </div>

        {/* Right: Totals (AC6) */}
        <div className="flex flex-col justify-end gap-0">
          {/* Subtotal — always visible */}
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="text-gray-400">Subtotal</span>
            <span className="font-semibold text-gray-900">
              {formatINR(subtotal)}
            </span>
          </div>

          {/* Discount — only when > 0% */}
          {data.discount > 0 && (
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-400">
                Discount ({data.discount}%)
              </span>
              <span className="font-semibold text-gray-900">
                -{formatINR(discountAmount)}
              </span>
            </div>
          )}

          {/* Tax — only when > 0% */}
          {data.taxRate > 0 && (
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-400">Tax ({data.taxRate}%)</span>
              <span className="font-semibold text-gray-900">
                {formatINR(taxAmount)}
              </span>
            </div>
          )}

          {/* Total — bold, large */}
          <div className="flex justify-between pt-4">
            <span className="text-gray-400 text-base">Total</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatINR(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
