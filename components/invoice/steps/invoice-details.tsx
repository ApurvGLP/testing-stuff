"use client";

import { Input } from "@/components/ui/input";
import type { InvoiceData } from "@/app/types/invoice-types";

interface InvoiceDetailsProps {
  data: InvoiceData;
  onChange: (updates: Partial<InvoiceData>) => void;
}

export function InvoiceDetails({ data, onChange }: InvoiceDetailsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Invoice Details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Invoice ID</label>
          <Input
            placeholder="INV-001"
            value={data.invoiceId}
            onChange={(e) => onChange({ invoiceId: e.target.value })}
            className="rounded-none border border-dashed"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Invoice Date</label>
          <Input
            type="date"
            value={data.invoiceDate}
            onChange={(e) => onChange({ invoiceDate: e.target.value })}
            className="rounded-none border border-dashed"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Due Date</label>
          <Input
            type="date"
            value={data.dueDate}
            onChange={(e) => onChange({ dueDate: e.target.value })}
            className="rounded-none border border-dashed"
          />
        </div>
      </div>
    </div>
  );
}
