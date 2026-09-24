"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { InvoiceData } from "@/app/types/invoice-types";

interface SenderDetailsProps {
  data: InvoiceData;
  onChange: (updates: Partial<InvoiceData>) => void;
}

export function SenderDetails({ data, onChange }: SenderDetailsProps) {
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ senderLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">From (Sender)</h2>
      <div>
        <label className="text-sm font-medium">Logo</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="block w-full rounded-none border border-dashed border-border px-3 py-2 text-sm"
        />
        {data.senderLogo && (
          <div className="mt-2">
            <img
              src={data.senderLogo}
              alt="Logo"
              className="h-16 w-16 object-cover rounded-none border border-dashed border-border"
            />
          </div>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input
            placeholder="Your Company Name"
            value={data.senderName}
            onChange={(e) => onChange({ senderName: e.target.value })}
            className="rounded-none border border-dashed"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            placeholder="your@email.com"
            value={data.senderEmail}
            onChange={(e) => onChange({ senderEmail: e.target.value })}
            className="rounded-none border border-dashed"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <Input
            placeholder="+91 XXXXX XXXXX"
            value={data.senderPhone}
            onChange={(e) => onChange({ senderPhone: e.target.value })}
            className="rounded-none border border-dashed"
          />
        </div>
        <div>
          <label className="text-sm font-medium">UPI ID</label>
          <Input
            placeholder="yourname@upi"
            value={data.upiId}
            onChange={(e) => onChange({ upiId: e.target.value })}
            className="rounded-none border border-dashed"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Address</label>
        <Textarea
          placeholder="Your business address"
          value={data.senderAddress}
          onChange={(e) => onChange({ senderAddress: e.target.value })}
          className="rounded-none border border-dashed"
        />
      </div>
    </div>
  );
}
