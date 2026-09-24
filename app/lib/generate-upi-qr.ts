import QRCode from "qrcode";

interface GenerateUPIQRParams {
  upiId: string;
  name: string;
  amount: number;
  invoiceNo: string;
}

export async function generateUPIQR({
  upiId,
  name,
  amount,
  invoiceNo,
}: GenerateUPIQRParams): Promise<string> {
  const uri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Invoice " + invoiceNo)}&tr=INV-${invoiceNo}`;
  return QRCode.toDataURL(uri, {
    width: 200,
    margin: 1,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}
