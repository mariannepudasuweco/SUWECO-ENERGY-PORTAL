import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type GeneratedPdf = {
  filename: string;
  pdfBase64: string;
  blob: Blob;
  orientation: "portrait" | "landscape";
  pageCount: number;
};

type CanvasRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TableRegion = {
  top: number;
  bottom: number;
  header: CanvasRegion | null;
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
          if (image.complete) {
            resolve();
            return;
          }

          const finish = () => resolve();

          image.addEventListener("load", finish, { once: true });
          image.addEventListener("error", finish, { once: true });
          window.setTimeout(finish, 5000);
        })
    )
  );
};

const waitForLayout = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });

function chooseOrientation(document: Document): "portrait" | "landscape" {
  const tables = Array.from(document.querySelectorAll("table"));

  const mostColumns = tables.reduce((maximum, table) => {
    const firstHeaderRow = table.querySelector("thead tr");
    const firstBodyRow = table.querySelector("tbody tr");
    const columnCount = Math.max(
      firstHeaderRow?.children.length || 0,
      firstBodyRow?.children.length || 0
    );

    return Math.max(maximum, columnCount);
  }, 0);

  const title = document.title.toLowerCase();
  const hasWideReportName = [
    "boq",
    "charging",
    "procurement",
    "materials",
    "payroll",
    "schedule",
  ].some((word) => title.includes(word));

  return mostColumns >= 6 || hasWideReportName ? "landscape" : "portrait";
}

function injectPdfStyles(
  document: Document,
  orientation: "portrait" | "landscape",
  targetWidth: number
) {
  document.querySelector("style[data-pdf-layout-fix]")?.remove();

  const style = document.createElement("style");
  style.setAttribute("data-pdf-layout-fix", "true");
  style.textContent = `
    html,
    body {
      width: ${targetWidth}px !important;
      min-width: ${targetWidth}px !important;
      max-width: ${targetWidth}px !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      overflow: visible !important;
    }

    body {
      font-size: ${orientation === "landscape" ? "11px" : "12px"} !important;
      line-height: 1.3 !important;
    }

    .report-document,
    main,
    #reactContainer,
    #contentArea {
      display: block !important;
      width: ${targetWidth}px !important;
      min-width: ${targetWidth}px !important;
      max-width: ${targetWidth}px !important;
      margin: 0 !important;
      padding: ${orientation === "landscape" ? "22px" : "26px"} !important;
      overflow: visible !important;
      box-sizing: border-box !important;
    }

    .report-document *,
    main *,
    #reactContainer *,
    #contentArea * {
      box-sizing: border-box !important;
      max-width: 100% !important;
    }

    .report-header {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .report-section,
    .section-content {
      width: 100% !important;
      max-width: 100% !important;
      overflow: visible !important;
    }

    table {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      overflow: visible !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
      font-size: ${orientation === "landscape" ? "8.8px" : "9.6px"} !important;
      line-height: 1.22 !important;
    }

    thead {
      display: table-header-group !important;
    }

    tfoot {
      display: table-footer-group !important;
    }

    tr,
    td,
    th,
    .report-card,
    .report-kpi-card,
    .report-summary-box,
    [data-report-row] {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    th,
    td {
      min-width: 0 !important;
      max-width: none !important;
      padding: 5px 6px !important;
      white-space: normal !important;
      overflow: visible !important;
      overflow-wrap: anywhere !important;
      word-break: normal !important;
      hyphens: auto !important;
      vertical-align: top !important;
      line-height: 1.22 !important;
    }

    th {
      font-size: ${orientation === "landscape" ? "8.5px" : "9.2px"} !important;
    }

    .overflow-x-auto,
    .overflow-auto,
    [style*="overflow-x"],
    [style*="overflow: auto"],
    [style*="overflow:auto"] {
      width: 100% !important;
      max-width: 100% !important;
      overflow: visible !important;
    }

    img,
    svg,
    canvas {
      max-width: 100% !important;
      height: auto !important;
    }

    [data-report-exclude="true"],
    button,
    input,
    select,
    textarea,
    form,
    nav {
      display: none !important;
    }
  `;

  document.head.appendChild(style);
}

function getCanvasRegion(
  element: Element,
  rootRect: DOMRect,
  scaleX: number,
  scaleY: number
): CanvasRegion | null {
  const rect = element.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return {
    x: Math.max(0, Math.round((rect.left - rootRect.left) * scaleX)),
    y: Math.max(0, Math.round((rect.top - rootRect.top) * scaleY)),
    width: Math.max(1, Math.round(rect.width * scaleX)),
    height: Math.max(1, Math.round(rect.height * scaleY)),
  };
}

function getSafeBreaks(root: HTMLElement, scaleY: number): number[] {
  const rootRect = root.getBoundingClientRect();

  const selectors = [
    "tbody tr",
    "tfoot tr",
    ".report-summary-box",
    ".report-kpi-grid",
    ".report-card",
    "[data-report-row]",
    ".section-content > *",
    ".report-section",
  ].join(",");

  const candidates = Array.from(root.querySelectorAll(selectors)) as HTMLElement[];

  const breaks = candidates
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return (rect.bottom - rootRect.top) * scaleY;
    })
    .filter((value) => Number.isFinite(value) && value > 0)
    .map((value) => Math.round(value))
    .sort((a, b) => a - b);

  return Array.from(new Set(breaks));
}

function getReportHeader(
  root: HTMLElement,
  scaleX: number,
  scaleY: number
): CanvasRegion | null {
  const header = root.querySelector(".report-header");

  if (!header) {
    return null;
  }

  return getCanvasRegion(header, root.getBoundingClientRect(), scaleX, scaleY);
}

function getTableRegions(
  root: HTMLElement,
  scaleX: number,
  scaleY: number
): TableRegion[] {
  const rootRect = root.getBoundingClientRect();

  return Array.from(root.querySelectorAll("table"))
    .map((table): TableRegion | null => {
      const tableRegion = getCanvasRegion(table, rootRect, scaleX, scaleY);

      if (!tableRegion) {
        return null;
      }

      const thead = table.querySelector("thead");
      const header = thead
        ? getCanvasRegion(thead, rootRect, scaleX, scaleY)
        : null;

      return {
        top: tableRegion.y,
        bottom: tableRegion.y + tableRegion.height,
        header,
      };
    })
    .filter((region): region is TableRegion => Boolean(region));
}

function findActiveTableHeader(
  tableRegions: TableRegion[],
  sourceY: number
): CanvasRegion | null {
  const activeTable = tableRegions.find(
    (table) => sourceY > table.top && sourceY < table.bottom
  );

  return activeTable?.header || null;
}

function drawCanvasRegion(
  context: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  region: CanvasRegion,
  destinationY: number
) {
  context.drawImage(
    sourceCanvas,
    region.x,
    region.y,
    region.width,
    region.height,
    region.x,
    destinationY,
    region.width,
    region.height
  );
}

function findPageEnd(options: {
  sourceY: number;
  maximumEnd: number;
  safeBreaks: number[];
  canvasHeight: number;
}): number {
  const { sourceY, maximumEnd, safeBreaks, canvasHeight } = options;

  if (maximumEnd >= canvasHeight) {
    return canvasHeight;
  }

  const minimumUsefulEnd = sourceY + (maximumEnd - sourceY) * 0.58;

  const candidates = safeBreaks.filter(
    (value) => value > minimumUsefulEnd && value <= maximumEnd
  );

  if (candidates.length > 0) {
    return candidates[candidates.length - 1];
  }

  return maximumEnd;
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
    opacity: "0",
    pointerEvents: "none",
    background: "#ffffff",
  });

  document.body.appendChild(iframe);

  try {
    const documentInFrame =
      iframe.contentDocument || iframe.contentWindow?.document;

    if (!documentInFrame) {
      throw new Error(`Unable to prepare "${reportTitle}" for PDF generation.`);
    }

    documentInFrame.open();
    documentInFrame.write(reportHtml);
    documentInFrame.close();

    await new Promise<void>((resolve) => {
      if (
        documentInFrame.readyState === "complete" ||
        documentInFrame.readyState === "interactive"
      ) {
        window.setTimeout(resolve, 350);
        return;
      }

      iframe.addEventListener("load", () => resolve(), { once: true });
      window.setTimeout(resolve, 2000);
    });

    await waitForImages(documentInFrame);

    const orientation = chooseOrientation(documentInFrame);
    const targetWidth = orientation === "landscape" ? 1123 : 794;

    iframe.style.width = `${targetWidth}px`;
    injectPdfStyles(documentInFrame, orientation, targetWidth);
    await waitForLayout();

    const root =
      documentInFrame.querySelector<HTMLElement>(".report-document") ||
      documentInFrame.body;

    if (!root) {
      throw new Error(`Unable to find printable content for "${reportTitle}".`);
    }

    root.style.width = `${targetWidth}px`;
    root.style.minWidth = `${targetWidth}px`;
    root.style.maxWidth = `${targetWidth}px`;
    root.style.overflow = "visible";

    await waitForLayout();

    const contentHeight = Math.max(root.scrollHeight, root.offsetHeight, 1);
    iframe.style.height = `${contentHeight}px`;

    const canvas = await html2canvas(root, {
      backgroundColor: "#ffffff",
      scale: 1.7,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: targetWidth,
      height: contentHeight,
      windowWidth: targetWidth,
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
    const reportHeader = getReportHeader(root, scaleX, scaleY);
    const tableRegions = getTableRegions(root, scaleX, scaleY);

    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 7;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;
    const pixelsPerMillimeter = canvas.width / usableWidth;
    const fullPageHeightPx = Math.floor(usableHeight * pixelsPerMillimeter);

    let sourceY = 0;
    let pageIndex = 0;

    while (sourceY < canvas.height - 1) {
      const repeatedRegions: CanvasRegion[] = [];

      if (pageIndex > 0 && reportHeader) {
        repeatedRegions.push(reportHeader);
      }

      const activeTableHeader =
        pageIndex > 0 ? findActiveTableHeader(tableRegions, sourceY) : null;

      if (
        activeTableHeader &&
        !repeatedRegions.some(
          (region) =>
            region.y === activeTableHeader.y &&
            region.height === activeTableHeader.height
        )
      ) {
        repeatedRegions.push(activeTableHeader);
      }

      const repeatedHeight = repeatedRegions.reduce(
        (sum, region) => sum + region.height,
        0
      );

      const availableContentHeight = Math.max(
        1,
        fullPageHeightPx - repeatedHeight
      );

      const maximumEnd = Math.min(
        canvas.height,
        sourceY + availableContentHeight
      );

      let endY = findPageEnd({
        sourceY,
        maximumEnd,
        safeBreaks,
        canvasHeight: canvas.height,
      });

      if (endY <= sourceY + 5) {
        endY = maximumEnd;
      }

      const contentSliceHeight = Math.max(1, Math.ceil(endY - sourceY));

      // Every generated page uses the same fixed canvas height. This prevents
      // the final page from being enlarged compared with earlier pages.
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = fullPageHeightPx;

      const context = pageCanvas.getContext("2d");

      if (!context) {
        throw new Error(`Unable to create a PDF page for "${reportTitle}".`);
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      let destinationY = 0;

      repeatedRegions.forEach((region) => {
        drawCanvasRegion(context, canvas, region, destinationY);
        destinationY += region.height;
      });

      context.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        contentSliceHeight,
        0,
        destinationY,
        canvas.width,
        contentSliceHeight
      );

      if (pageIndex > 0) {
        pdf.addPage("a4", orientation);
      }

      const imageData = pageCanvas.toDataURL("image/jpeg", 0.95);

      pdf.addImage(
        imageData,
        "JPEG",
        margin,
        margin,
        usableWidth,
        usableHeight,
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
