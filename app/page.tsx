"use client";

import { useState } from "react";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { generateUPIQR } from "./lib/generate-upi-qr";
import { downloadInvoiceAsPDF } from "./lib/download-invoice";
import { Button } from "@/components/ui/button";
import { Download } from "@phosphor-icons/react";
import { Kbd } from "@/components/ui/kbd";
import type { InvoiceData } from "@/app/types/invoice-types";
import {
  calculateInvoiceFinancials,
} from "@/lib/invoice-calculations";

function getDefaultInvoiceData(): InvoiceData {
  const today = new Date();
  const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    invoiceId: "INV-001",
    invoiceDate: today.toISOString().split("T")[0],
    dueDate: dueDate.toISOString().split("T")[0],
    senderName: "",
    senderEmail: "",
    senderPhone: "",
    senderAddress: "",
    senderLogo: undefined,
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    lineItems: [{ id: "1", description: "", quantity: 1, rate: 0 }],
    discount: 0,
    taxRate: 18,
    notes: "",
    upiId: "",
    paymentTerms: "",
  };
}

export default function Home() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(
    getDefaultInvoiceData
  );

  const [isFinalized, setIsFinalized] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFinalize = async () => {
    if (!invoiceData.upiId) return;

    setIsGenerating(true);
    try {
      const { total } = calculateInvoiceFinancials(invoiceData);
      const dataUrl = await generateUPIQR({
        upiId: invoiceData.upiId,
        name: invoiceData.senderName,
        amount: total,
        invoiceNo: invoiceData.invoiceId,
      });
      setQrDataUrl(dataUrl);
      setIsFinalized(true);
    } catch (err) {
      console.error("QR generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // AC7: When user edits anything after finalizing, reset QR so shimmer returns
  const handleChange = (data: InvoiceData) => {
    setInvoiceData(data);
    if (isFinalized) {
      setIsFinalized(false);
      setQrDataUrl(undefined);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-dashed border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              UPI Invoice Maker
            </h1>
            <p className="text-sm text-muted-foreground">
              Create professional invoices with QR payment codes
            </p>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            Press <Kbd>D</Kbd> to switch themes
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left: 5-step wizard form */}
          <div className="space-y-6">
            <InvoiceForm
              data={invoiceData}
              onChange={handleChange}
              onFinalize={handleFinalize}
              isGenerating={isGenerating}
              isFinalized={isFinalized}
            />
          </div>

          {/* Right: Sticky live preview */}
          <div className="sticky top-8 h-fit">
            <div className="border border-dashed border-border bg-card p-8">
              <InvoicePreview
                data={invoiceData}
                isFinalized={isFinalized}
                qrDataUrl={qrDataUrl}
              />
            </div>
            <Button
              onClick={() => downloadInvoiceAsPDF(invoiceData.invoiceId)}
              disabled={!isFinalized}
              variant="outline"
              className="gap-2 rounded-none mt-4"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
