"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { InvoiceData } from "@/app/types/invoice-types";

interface ClientDetailsProps {
  data: InvoiceData;
  onChange: (updates: Partial<InvoiceData>) => void;
}

export function ClientDetails({ data, onChange }: ClientDetailsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Bill To (Client)</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input
            placeholder="Client Name"
            value={data.clientName}
            onChange={(e) => onChange({ clientName: e.target.value })}
            className="rounded-none border border-dashed"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            placeholder="client@email.com"
            value={data.clientEmail}
            onChange={(e) => onChange({ clientEmail: e.target.value })}
            className="rounded-none border border-dashed"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <Input
            placeholder="+91 XXXXX XXXXX"
            value={data.clientPhone}
            onChange={(e) => onChange({ clientPhone: e.target.value })}
            className="rounded-none border border-dashed"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Address</label>
        <Textarea
          placeholder="Client business address"
          value={data.clientAddress}
          onChange={(e) => onChange({ clientAddress: e.target.value })}
          className="rounded-none border border-dashed"
        />
      </div>
    </div>
  );
}
