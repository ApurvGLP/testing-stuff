"use client";

import { InvoicePreview } from "@/components/invoice/invoice-preview";
import type { InvoiceData } from "@/app/types/invoice-types";

/**
 * Internal test page — renders InvoicePreview with sample data so
 * Playwright E2E tests can assert against visible output.
 *
 * NOT shipped to production (this route is only used during testing).
 */
const sampleData: InvoiceData = {
  invoiceId: "INV-042",
  invoiceDate: "2026-09-18",
  dueDate: "2026-10-18",
  senderName: "Acme Corp",
  senderEmail: "billing@acme.com",
  senderPhone: "+91 98765 43210",
  senderAddress: "123 MG Road, Mumbai",
  clientName: "Beta Inc",
  clientEmail: "accounts@beta.io",
  clientPhone: "+91 91234 56789",
  clientAddress: "456 Brigade Road, Bengaluru",
  lineItems: [
    { id: "1", description: "Website Design", quantity: 1, rate: 50000 },
    { id: "2", description: "SEO Audit", quantity: 2, rate: 15000 },
    { id: "3", description: "", quantity: 3, rate: 100 },
  ],
  discount: 10,
  taxRate: 18,
  notes: "Payment due within 30 days.\nThank you!",
  upiId: "acme@upi",
  paymentTerms: "Net 30",
};

export default function PreviewTestPage() {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto border border-dashed border-gray-300 bg-white p-8">
        <InvoicePreview data={sampleData} />
      </div>

      {/* Second preview: empty/edge-case data */}
      <div
        id="empty-preview"
        className="max-w-3xl mx-auto mt-8 border border-dashed border-gray-300 bg-white p-8"
      >
        <InvoicePreview
          data={{
            invoiceId: "",
            invoiceDate: "",
            dueDate: "",
            senderName: "",
            senderEmail: "",
            senderPhone: "",
            senderAddress: "",
            clientName: "",
            clientEmail: "",
            clientPhone: "",
            clientAddress: "",
            lineItems: [],
            discount: 0,
            taxRate: 0,
            notes: "",
            upiId: "",
            paymentTerms: "",
          }}
        />
      </div>

      {/* Third preview: finalized with QR */}
      <div
        id="finalized-preview"
        className="max-w-3xl mx-auto mt-8 border border-dashed border-gray-300 bg-white p-8"
      >
        <InvoicePreview
          data={{ ...sampleData, upiId: "seller@ybl" }}
          isFinalized={true}
          qrDataUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />
      </div>
    </div>
  );
}
