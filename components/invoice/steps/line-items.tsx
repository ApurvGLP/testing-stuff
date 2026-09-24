"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InvoiceData, LineItem } from "@/app/types/invoice-types";
import { Plus, Trash } from "@phosphor-icons/react";

interface LineItemsProps {
  data: InvoiceData;
  onChange: (updates: Partial<InvoiceData>) => void;
}

export function LineItems({ data, onChange }: LineItemsProps) {
  const updateLineItem = (index: number, updates: Partial<LineItem>) => {
    const newItems = [...data.lineItems];
    newItems[index] = { ...newItems[index], ...updates };
    onChange({ lineItems: newItems });
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      rate: 0,
    };
    onChange({ lineItems: [...data.lineItems, newItem] });
  };

  const removeLineItem = (index: number) => {
    if (data.lineItems.length <= 1) return; // Keep at least 1 item
    onChange({ lineItems: data.lineItems.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Line Items</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {data.lineItems.map((item, index) => (
          <div
            key={item.id}
            className="flex items-end gap-3 p-3 border border-dashed border-border"
          >
            <div className="flex-[3] min-w-0">
              <label className="text-xs font-medium text-muted-foreground">
                Description
              </label>
              <Input
                placeholder="Item description"
                value={item.description}
                onChange={(e) =>
                  updateLineItem(index, { description: e.target.value })
                }
                className="rounded-none border border-dashed text-sm"
              />
            </div>
            <div className="flex-[1] min-w-0">
              <label className="text-xs font-medium text-muted-foreground">
                Qty
              </label>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  updateLineItem(index, {
                    quantity: parseFloat(e.target.value) || 1,
                  })
                }
                className="rounded-none border border-dashed text-sm font-mono"
              />
            </div>
            <div className="flex-[1] min-w-0">
              <label className="text-xs font-medium text-muted-foreground">
                Rate
              </label>
              <Input
                min="0"
                step="0.01"
                value={item.rate}
                onChange={(e) =>
                  updateLineItem(index, {
                    rate: parseFloat(e.target.value) || 0,
                  })
                }
                className="rounded-none border border-dashed text-sm font-mono"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => removeLineItem(index)}
              disabled={data.lineItems.length <= 1}
              className="rounded-none shrink-0"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        onClick={addLineItem}
        className="w-full gap-2 rounded-none border border-dashed"
      >
        <Plus className="h-4 w-4" />
        Add Line Item
      </Button>
    </div>
  );
}
