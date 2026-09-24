export interface InvoiceData {
  invoiceId: string;
  invoiceDate: string;
  dueDate: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderAddress: string;
  senderLogo?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  lineItems: LineItem[];
  discount: number;
  taxRate: number;
  notes: string;
  upiId: string;
  paymentTerms: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}
