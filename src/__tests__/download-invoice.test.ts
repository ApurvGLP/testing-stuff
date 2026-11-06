import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

/**
 * Unit tests for app/lib/download-invoice.ts — downloadInvoiceAsPDF()
 *
 * The real function uses dynamic `await import()` for html2canvas-pro and jspdf,
 * which require a full browser DOM. Node 20 does not support `mock.module()`,
 * so we test in two layers:
 *
 *   1. Error-path test — calls the real exported function with a mocked
 *      `globalThis.document` to verify the guard clause.
 *
 *   2. Algorithm-level tests — exercises the exact same PDF-generation logic
 *      (canvas → image → jsPDF → multi-page split → save → cleanup) through
 *      a test-local replica that accepts injected dependencies. This lets us
 *      verify html2canvas options, jsPDF constructor args, filename, multi-page
 *      splitting, and canvas cleanup without a real browser.
 *
 * Full integration coverage is provided by the Playwright E2E tests in e2e/.
 */

// ---------------------------------------------------------------------------
// Test-local replica of the core algorithm (everything after element lookup)
// Accepts injected dependencies so we can verify calls without a real DOM.
// ---------------------------------------------------------------------------

interface MockCanvas {
  width: number;
  height: number;
  toDataURL: (type: string) => string;
}

interface MockPdf {
  internal: {
    pageSize: {
      getWidth: () => number;
      getHeight: () => number;
    };
  };
  addImage: (...args: unknown[]) => void;
  addPage: () => void;
  save: (filename: string) => void;
}

async function downloadLogicUnderTest(
  element: unknown,
  html2canvasFn: (el: unknown, opts: Record<string, unknown>) => Promise<MockCanvas>,
  JsPDFClass: new (opts: Record<string, unknown>) => MockPdf,
  invoiceId: string,
): Promise<void> {
  // ---- This logic mirrors app/lib/download-invoice.ts exactly ----
  if (!element) throw new Error("Invoice preview element not found");

  const canvas = await html2canvasFn(element, {
    scale: 3,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  try {
    const imgData = canvas.toDataURL("image/png");

    const pdf = new JsPDFClass({
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
  } finally {
    // Release the GPU-backed bitmap memory held by the canvas
    canvas.width = 0;
    canvas.height = 0;
  }
}

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function createMockCanvas(width = 2100, height = 2970): MockCanvas {
  return {
    width,
    height,
    toDataURL: () => "data:image/png;base64,AAAA",
  };
}

interface MockPdfTracked extends MockPdf {
  addImageCalls: unknown[][];
  addPageCount: number;
  savedFilename: string | null;
}

function createMockPdf(): MockPdfTracked {
  const self: MockPdfTracked = {
    addImageCalls: [],
    addPageCount: 0,
    savedFilename: null,
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
    addImage(...args: unknown[]) { self.addImageCalls.push(args); },
    addPage() { self.addPageCount++; },
    save(filename: string) { self.savedFilename = filename; },
  };
  return self;
}

// ---------------------------------------------------------------------------
// 1. Error-path test — real function
// ---------------------------------------------------------------------------

describe("downloadInvoiceAsPDF — real function", () => {
  const originalDocument = globalThis.document;

  afterEach(() => {
    // Restore original document (or remove the mock)
    if (originalDocument !== undefined) {
      globalThis.document = originalDocument;
    } else {
      delete (globalThis as Record<string, unknown>).document;
    }
  });

  it("throws when #invoice-preview element is missing", async () => {
    // Mock document.getElementById to return null
    (globalThis as Record<string, unknown>).document = {
      getElementById: () => null,
    };

    const { downloadInvoiceAsPDF } = await import("../../app/lib/download-invoice.ts");

    await assert.rejects(
      () => downloadInvoiceAsPDF("INV-001"),
      { message: "Invoice preview element not found" },
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Algorithm-level tests — test-local replica with injected dependencies
// ---------------------------------------------------------------------------

describe("downloadInvoiceAsPDF — algorithm tests", () => {
  let html2canvasCallArgs: { element: unknown; opts: Record<string, unknown> } | null;
  let jsPDFConstructorOpts: Record<string, unknown> | null;
  let mockCanvas: MockCanvas;
  let mockPdfInstance: MockPdfTracked;
  let html2canvasFn: (el: unknown, opts: Record<string, unknown>) => Promise<MockCanvas>;
  let JsPDFClass: new (opts: Record<string, unknown>) => MockPdf;

  beforeEach(() => {
    html2canvasCallArgs = null;
    jsPDFConstructorOpts = null;

    // Default: canvas fits on one A4 page (aspect ratio ~= 297/210 ≈ 1.414)
    mockCanvas = createMockCanvas(2100, 2970);
    mockPdfInstance = createMockPdf();

    html2canvasFn = async (el: unknown, opts: Record<string, unknown>) => {
      html2canvasCallArgs = { element: el, opts };
      return mockCanvas;
    };

    // When a JS constructor returns an object, `new` returns that object
    JsPDFClass = function (this: unknown, opts: Record<string, unknown>) {
      jsPDFConstructorOpts = opts;
      return mockPdfInstance;
    } as unknown as new (opts: Record<string, unknown>) => MockPdf;
  });

  it("calls html2canvas with correct options (3× scale, useCORS, white bg, no logging)", async () => {
    const fakeElement = { id: "invoice-preview" };
    await downloadLogicUnderTest(fakeElement, html2canvasFn, JsPDFClass, "INV-001");

    assert.ok(html2canvasCallArgs, "html2canvas should have been called");
    assert.deepStrictEqual(html2canvasCallArgs.opts, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    assert.strictEqual(html2canvasCallArgs.element, fakeElement);
  });

  it("constructs jsPDF with A4 portrait format", async () => {
    const fakeElement = { id: "invoice-preview" };
    await downloadLogicUnderTest(fakeElement, html2canvasFn, JsPDFClass, "INV-001");

    assert.ok(jsPDFConstructorOpts, "jsPDF constructor should have been called");
    assert.strictEqual(jsPDFConstructorOpts.orientation, "portrait");
    assert.strictEqual(jsPDFConstructorOpts.unit, "mm");
    assert.strictEqual(jsPDFConstructorOpts.format, "a4");
  });

  it("saves PDF with filename matching invoiceId (INV-001.pdf)", async () => {
    const fakeElement = { id: "invoice-preview" };
    await downloadLogicUnderTest(fakeElement, html2canvasFn, JsPDFClass, "INV-001");

    assert.strictEqual(mockPdfInstance.savedFilename, "INV-001.pdf");
  });

  it("uses fallback filename 'invoice.pdf' when invoiceId is empty", async () => {
    const fakeElement = { id: "invoice-preview" };
    await downloadLogicUnderTest(fakeElement, html2canvasFn, JsPDFClass, "");

    assert.strictEqual(mockPdfInstance.savedFilename, "invoice.pdf");
  });

  it("cleans up canvas memory (width/height set to 0) after PDF generation", async () => {
    const fakeElement = { id: "invoice-preview" };
    await downloadLogicUnderTest(fakeElement, html2canvasFn, JsPDFClass, "INV-001");

    assert.strictEqual(mockCanvas.width, 0, "canvas width should be 0 after cleanup");
    assert.strictEqual(mockCanvas.height, 0, "canvas height should be 0 after cleanup");
  });

  it("does NOT call addPage when content fits on a single A4 page", async () => {
    // Canvas aspect ratio = 2970/2100 ≈ 1.414
    // imgHeight = 210 * (2970/2100) = 297mm = exactly A4 height
    // Since imgHeight <= pdfHeight, single page path is taken
    mockCanvas = createMockCanvas(2100, 2970);

    const fakeElement = { id: "invoice-preview" };
    await downloadLogicUnderTest(fakeElement, html2canvasFn, JsPDFClass, "INV-001");

    assert.strictEqual(mockPdfInstance.addPageCount, 0, "addPage should not be called for single-page content");
  });

  it("calls addPage when content exceeds A4 height (multi-page)", async () => {
    // Make canvas very tall: aspect ratio = 6000/2100 ≈ 2.857
    // imgHeight = 210 * (6000/2100) = 600mm >> 297mm → needs multiple pages
    mockCanvas = createMockCanvas(2100, 6000);

    // Recreate the mock pdf instance for this test (fresh counters)
    mockPdfInstance = createMockPdf();
    JsPDFClass = function (this: unknown, opts: Record<string, unknown>) {
      jsPDFConstructorOpts = opts;
      return mockPdfInstance;
    } as unknown as new (opts: Record<string, unknown>) => MockPdf;

    const fakeElement = { id: "invoice-preview" };
    await downloadLogicUnderTest(fakeElement, html2canvasFn, JsPDFClass, "INV-001");

    assert.ok(mockPdfInstance.addPageCount >= 1, `addPage should be called at least once for tall content, got ${mockPdfInstance.addPageCount}`);
  });

  it("calculates correct number of pages for multi-page content", async () => {
    // imgHeight = 210 * (9000/2100) = 900mm
    // Remaining after page 1: 900 - 297 = 603 → addPage
    // Remaining after page 2: 603 - 297 = 306 → addPage
    // Remaining after page 3: 306 - 297 = 9 → addPage
    // Remaining after page 4: 9 - 297 = -288 → done
    // addPage is called 3 times
    mockCanvas = createMockCanvas(2100, 9000);

    mockPdfInstance = createMockPdf();
    JsPDFClass = function (this: unknown, opts: Record<string, unknown>) {
      jsPDFConstructorOpts = opts;
      return mockPdfInstance;
    } as unknown as new (opts: Record<string, unknown>) => MockPdf;

    const fakeElement = { id: "invoice-preview" };
    await downloadLogicUnderTest(fakeElement, html2canvasFn, JsPDFClass, "INV-001");

    assert.strictEqual(mockPdfInstance.addPageCount, 3, "should add 3 extra pages for ~900mm content");
  });

  it("cleans up canvas even if pdf.save throws", async () => {
    mockCanvas = createMockCanvas(2100, 2970);
    const throwingPdfInstance = createMockPdf();
    throwingPdfInstance.save = () => { throw new Error("save failed"); };

    const ThrowingJsPDFClass = function (this: unknown, opts: Record<string, unknown>) {
      jsPDFConstructorOpts = opts;
      return throwingPdfInstance;
    } as unknown as new (opts: Record<string, unknown>) => MockPdf;

    const fakeElement = { id: "invoice-preview" };
    await assert.rejects(
      () => downloadLogicUnderTest(fakeElement, html2canvasFn, ThrowingJsPDFClass, "INV-001"),
      { message: "save failed" },
    );

    assert.strictEqual(mockCanvas.width, 0, "canvas width should be 0 even after error");
    assert.strictEqual(mockCanvas.height, 0, "canvas height should be 0 even after error");
  });

  it("throws when element is null (algorithm guard)", async () => {
    await assert.rejects(
      () => downloadLogicUnderTest(null, html2canvasFn, JsPDFClass, "INV-001"),
      { message: "Invoice preview element not found" },
    );
  });
});
