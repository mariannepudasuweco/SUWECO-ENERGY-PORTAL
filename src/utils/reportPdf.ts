import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type GeneratedPdf = {
  filename: string;
  pdfBase64: string;
  blob: Blob;
  orientation: "portrait" | "landscape";
  pageCount: number;
};

const sanitizeFilename = (value: string) => {
  const cleaned = String(value || "generated-report")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "");
  return cleaned || "generated-report";
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unable to convert the generated PDF."));
        return;
      }
      const base64 = reader.result.split(",")[1];
      if (!base64) {
        reject(new Error("The generated PDF attachment is empty."));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () =>
      reject(reader.error || new Error("Unable to read the generated PDF."));
    reader.readAsDataURL(blob);
  });

const waitForImages = async (root: ParentNode) => {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) return resolve();
          const finish = () => resolve();
          image.addEventListener("load", finish, { once: true });
          image.addEventListener("error", finish, { once: true });
          window.setTimeout(finish, 5000);
        })
    )
  );
};

function chooseOrientation(document: Document): "portrait" | "landscape" {
  const tables = Array.from(document.querySelectorAll("table"));
  const widestTable = tables.reduce(
    (max, table) => Math.max(max, (table as HTMLElement).scrollWidth),
    0
  );
  const mostColumns = tables.reduce(
    (max, table) =>
      Math.max(max, table.querySelectorAll("thead tr:first-child th").length),
    0
  );
  return widestTable > 760 || mostColumns > 6 ? "landscape" : "portrait";
}

function injectPdfStyles(document: Document, orientation: "portrait" | "landscape") {
  const style = document.createElement("style");
  style.setAttribute("data-pdf-layout-fix", "true");
  style.textContent = `
    html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
    body { overflow: visible !important; }
    .report-document, main, #reactContainer, #contentArea {
      width: ${orientation === "landscape" ? "1123px" : "794px"} !important;
      max-width: none !important;
      min-width: 0 !important;
      overflow: visible !important;
      box-sizing: border-box !important;
    }
    table {
      width: 100% !important;
      max-width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      overflow: visible !important;
    }
    th, td {
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: break-word !important;
      vertical-align: top !important;
      line-height: 1.25 !important;
      box-sizing: border-box !important;
    }
    thead { display: table-header-group !important; }
    tfoot { display: table-footer-group !important; }
    tr, td, th, .report-card, [data-report-row] {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .overflow-x-auto, .overflow-auto, [style*="overflow-x"] {
      overflow: visible !important;
      max-width: none !important;
    }
    img, svg, canvas { max-width: 100% !important; }
    [data-report-exclude="true"], button, input, select, textarea { display: none !important; }
  `;
  document.head.appendChild(style);
}

function getSafeBreaks(root: HTMLElement, scaleY: number): number[] {
  const rootRect = root.getBoundingClientRect();
  const candidates = Array.from(
    root.querySelectorAll("tr, [data-report-row], .report-card")
  ) as HTMLElement[];
  const breaks = candidates
    .map((el) => (el.getBoundingClientRect().bottom - rootRect.top) * scaleY)
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
  return Array.from(new Set(breaks.map((value) => Math.round(value))));
}

function findDominantHeader(root: HTMLElement, scaleX: number, scaleY: number) {
  const tables = Array.from(root.querySelectorAll("table")) as HTMLTableElement[];
  const dominant = tables.sort(
    (a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width
  )[0];
  const thead = dominant?.querySelector("thead") as HTMLElement | null;
  if (!thead) return null;
  const rootRect = root.getBoundingClientRect();
  const rect = thead.getBoundingClientRect();
  if (rect.height <= 0 || rect.width <= 0) return null;
  return {
    x: Math.max(0, Math.round((rect.left - rootRect.left) * scaleX)),
    y: Math.max(0, Math.round((rect.top - rootRect.top) * scaleY)),
    width: Math.round(rect.width * scaleX),
    height: Math.round(rect.height * scaleY),
  };
}

export async function generateReportPdf(
  reportHtml: string,
  reportTitle: string
): Promise<GeneratedPdf> {
  if (!reportHtml.trim()) {
    throw new Error(`"${reportTitle}" does not contain report content.`);
  }

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    left: "-100000px",
    top: "0",
    width: "1123px",
    height: "794px",
    border: "0",
    visibility: "hidden",
    pointerEvents: "none",
    background: "#ffffff",
  });
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) throw new Error(`Unable to prepare "${reportTitle}" for PDF generation.`);

    doc.open();
    doc.write(reportHtml);
    doc.close();

    await new Promise<void>((resolve) => {
      if (doc.readyState === "complete" || doc.readyState === "interactive") {
        window.setTimeout(resolve, 400);
      } else {
        iframe.addEventListener("load", () => resolve(), { once: true });
        window.setTimeout(resolve, 2000);
      }
    });
    await waitForImages(doc);

    const orientation = chooseOrientation(doc);
    injectPdfStyles(doc, orientation);
    iframe.style.width = orientation === "landscape" ? "1123px" : "794px";

    await new Promise<void>((resolve) =>
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
    );

    const root =
      doc.querySelector<HTMLElement>(".report-document") || doc.body;
    if (!root) throw new Error(`Unable to find printable content for "${reportTitle}".`);

    const contentWidth = Math.max(root.scrollWidth, orientation === "landscape" ? 1123 : 794);
    const contentHeight = Math.max(root.scrollHeight, 1);
    iframe.style.width = `${contentWidth}px`;
    iframe.style.height = `${contentHeight}px`;

    const canvas = await html2canvas(root, {
      backgroundColor: "#ffffff",
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      logging: false,
      windowWidth: contentWidth,
      windowHeight: contentHeight,
      scrollX: 0,
      scrollY: 0,
    });
    if (!canvas.width || !canvas.height) {
      throw new Error(`The generated PDF for "${reportTitle}" is empty.`);
    }

    const rootRect = root.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(rootRect.width, 1);
    const scaleY = canvas.height / Math.max(rootRect.height, 1);
    const safeBreaks = getSafeBreaks(root, scaleY);
    const repeatedHeader = findDominantHeader(root, scaleX, scaleY);

    const pdf = new jsPDF({ orientation, unit: "mm", format: "a4", compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;
    const pxPerMm = canvas.width / usableWidth;
    const fullPagePx = usableHeight * pxPerMm;
    const headerPx = repeatedHeader ? repeatedHeader.height : 0;

    let sourceY = 0;
    let pageIndex = 0;
    while (sourceY < canvas.height - 1) {
      const availablePx = fullPagePx - (pageIndex > 0 ? headerPx : 0);
      const targetEnd = Math.min(canvas.height, sourceY + availablePx);
      const lowerBound = sourceY + availablePx * 0.62;
      const safeCandidates = safeBreaks.filter(
        (value) => value > lowerBound && value <= targetEnd
      );
      let endY = safeCandidates.length
        ? safeCandidates[safeCandidates.length - 1]
        : targetEnd;
      if (endY <= sourceY + 10) endY = targetEnd;

      const sliceHeight = Math.max(1, Math.ceil(endY - sourceY));
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.ceil(sliceHeight + (pageIndex > 0 ? headerPx : 0));
      const context = pageCanvas.getContext("2d");
      if (!context) throw new Error(`Unable to create a PDF page for "${reportTitle}".`);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      let destinationY = 0;
      if (pageIndex > 0 && repeatedHeader) {
        context.drawImage(
          canvas,
          repeatedHeader.x,
          repeatedHeader.y,
          repeatedHeader.width,
          repeatedHeader.height,
          repeatedHeader.x,
          0,
          repeatedHeader.width,
          repeatedHeader.height
        );
        destinationY = headerPx;
      }
      context.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeight,
        0,
        destinationY,
        canvas.width,
        sliceHeight
      );

      if (pageIndex > 0) pdf.addPage("a4", orientation);
      const imageData = pageCanvas.toDataURL("image/jpeg", 0.94);
      const renderedHeight = usableWidth * (pageCanvas.height / pageCanvas.width);
      pdf.addImage(
        imageData,
        "JPEG",
        margin,
        margin,
        usableWidth,
        Math.min(renderedHeight, usableHeight),
        undefined,
        "FAST"
      );

      sourceY = endY;
      pageIndex += 1;
    }

    const blob = pdf.output("blob");
    return {
      filename: `${sanitizeFilename(reportTitle)}.pdf`,
      pdfBase64: await blobToBase64(blob),
      blob,
      orientation,
      pageCount: pageIndex,
    };
  } finally {
    iframe.remove();
  }
}
