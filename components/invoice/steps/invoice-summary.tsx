"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { InvoiceData } from "@/app/types/invoice-types";
import {
  calculateInvoiceFinancials,
  formatINR,
} from "@/lib/invoice-calculations";

interface InvoiceSummaryProps {
  data: InvoiceData;
  onChange: (updates: Partial<InvoiceData>) => void;
}

export function InvoiceSummary({ data, onChange }: InvoiceSummaryProps) {
  const { subtotal, discountAmount, taxableAmount, taxAmount, total } =
    calculateInvoiceFinancials(data);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Summary</h2>
      <div className="space-y-3 border border-dashed border-border p-4 rounded-none">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span className="font-mono">{formatINR(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <label className="text-sm">Discount (%):</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={data.discount}
            onChange={(e) =>
              onChange({ discount: parseFloat(e.target.value) || 0 })
            }
            className="w-24 rounded-none border border-dashed text-sm font-mono text-right"
          />
        </div>
        {data.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount Amount:</span>
            <span className="font-mono">-{formatINR(discountAmount)}</span>
          </div>
        )}
        <div className="border-t border-dashed border-border pt-3 space-y-2">
          <div className="flex justify-between">
            <span>Taxable Amount:</span>
            <span className="font-mono">{formatINR(taxableAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <label className="text-sm">Tax Rate (%):</label>
            <Input
              type="number"
              min="0"
              value={data.taxRate}
              onChange={(e) =>
                onChange({ taxRate: parseFloat(e.target.value) || 0 })
              }
              className="w-24 rounded-none border border-dashed text-sm font-mono text-right"
            />
          </div>
          <div className="flex justify-between text-blue-600">
            <span>Tax Amount:</span>
            <span className="font-mono">+{formatINR(taxAmount)}</span>
          </div>
        </div>
        <div className="border-t border-dashed border-border pt-3 flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span className="font-mono">{formatINR(total)}</span>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Notes</label>
        <Textarea
          placeholder="Thank you for your business!"
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="rounded-none border border-dashed"
        />
      </div>
    </div>
  );
}
