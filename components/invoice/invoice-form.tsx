"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { InvoiceData } from "@/app/types/invoice-types";

import { InvoiceDetails } from "./steps/invoice-details";
import { SenderDetails } from "./steps/sender-details";
import { ClientDetails } from "./steps/client-details";
import { LineItems } from "./steps/line-items";
import { InvoiceSummary } from "./steps/invoice-summary";

interface InvoiceFormProps {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
  onFinalize: () => Promise<void>;
  isGenerating: boolean;
  isFinalized: boolean;
}

const steps = [
  { title: "Invoice Details", key: "details" },
  { title: "From (Sender)", key: "sender" },
  { title: "Bill To (Client)", key: "client" },
  { title: "Line Items", key: "items" },
  { title: "Summary", key: "summary" },
];

export function InvoiceForm({
  data,
  onChange,
  onFinalize,
  isGenerating,
  isFinalized,
}: InvoiceFormProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const update = (updates: Partial<InvoiceData>) => {
    onChange({ ...data, ...updates });
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setCurrentStep(index)}
              className={`flex h-8 w-8 items-center justify-center rounded-none border border-dashed flex-shrink-0 text-xs ${
                index === currentStep
                  ? "border-primary bg-primary text-primary-foreground"
                  : index < currentStep
                    ? "border-border bg-muted text-muted-foreground"
                    : "border-border text-muted-foreground"
              }`}
            >
              {index + 1}
            </button>
            {index < steps.length - 1 && (
              <div className="h-px flex-1 border-t border-dashed border-border" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="rounded-none border border-dashed border-border p-6">
            {currentStep === 0 && (
              <InvoiceDetails data={data} onChange={update} />
            )}
            {currentStep === 1 && (
              <SenderDetails data={data} onChange={update} />
            )}
            {currentStep === 2 && (
              <ClientDetails data={data} onChange={update} />
            )}
            {currentStep === 3 && <LineItems data={data} onChange={update} />}
            {currentStep === 4 && (
              <InvoiceSummary data={data} onChange={update} />
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="gap-2 rounded-none"
        >
          <CaretLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </div>

        {isLastStep ? (
          <Button
            onClick={onFinalize}
            disabled={!data.upiId || isGenerating}
            className="gap-2 rounded-none min-w-36"
          >
            {isGenerating
              ? "Generating..."
              : isFinalized
                ? "✓ Regenerate QR"
                : "Generate Invoice"}
          </Button>
        ) : (
          <Button
            onClick={() =>
              setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
            }
            className="gap-2 rounded-none"
          >
            Next
            <CaretRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
