import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export async function downloadInvoiceAsPDF(invoiceId: string): Promise<void> {
  const element = document.getElementById("invoice-preview");
  if (!element) throw new Error("Invoice preview element not found");

  const canvas = await html2canvas(element, {
    scale: 3, // high-res — crisp QR code and text
    useCORS: true, // needed if you have logo images from external URLs
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");

  // A4 dimensions in mm
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

  // Scale the canvas to fit A4 width, maintain aspect ratio
  const canvasAspect = canvas.height / canvas.width;
  const imgHeight = pdfWidth * canvasAspect;

  // If content is taller than one A4 page, split across pages
  if (imgHeight <= pdfHeight) {
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
  } else {
    let yOffset = 0;
    let remainingHeight = imgHeight;

    while (remainingHeight > 0) {
      pdf.addImage(imgData, "PNG", 0, -yOffset, pdfWidth, imgHeight);
      remainingHeight -= pdfHeight;
      yOffset += pdfHeight;
      if (remainingHeight > 0) pdf.addPage();
    }
  }

  pdf.save(`${invoiceId || "invoice"}.pdf`);
}
