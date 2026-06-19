import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type GeneratedPdf = {
  filename: string;
  pdfBase64: string;
  blob: Blob;
  orientation: "portrait" | "landscape";
  pageCount: number;
};

type PaperSize = "a4" | "a3";
type Orientation = "portrait" | "landscape";

type PrintableSection = {
  element: HTMLElement;
  title: string;
  paperSize: PaperSize;
  orientation: Orientation;
  fitOnePage: boolean;
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

type PageLayout = {
  pageWidth: number;
  pageHeight: number;
  contentTop: number;
  contentBottom: number;
  availableWidth: number;
  availableHeight: number;
};

const PAGE_LAYOUT = {
  leftMargin: 10,
  rightMargin: 10,
  topMargin: 8,
  bottomMargin: 9,
  headerImageHeight: 13.5,
  headerTextHeight: 11,
  headerGap: 3.5,
  footerHeight: 7,
};

const OFFICIAL_REPORT_HEADER_URL =
  "https://res.cloudinary.com/dit5iwj2o/image/upload/v1780583251/sdfdadfassd_tejf8n.jpg";

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
          if (image.complete && image.naturalWidth > 0) {
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

function hasVisibleContent(element: HTMLElement | null): boolean {
  if (!element) return false;
  const text = element.innerText?.trim() || "";
  const count = element.querySelectorAll(
    "tbody tr, [data-report-item], .report-card, .report-kpi-card, canvas, svg, img"
  ).length;
  return text.length > 0 || count > 0;
}

function chooseOrientation(document: Document): Orientation {
  const mostColumns = Array.from(document.querySelectorAll("table")).reduce(
    (maximum, table) => {
      const head = table.querySelector("thead tr");
      const body = table.querySelector("tbody tr");
      return Math.max(maximum, head?.children.length || 0, body?.children.length || 0);
    },
    0
  );
  return mostColumns >= 6 ? "landscape" : "portrait";
}

function getSectionSettings(element: HTMLElement): PrintableSection {
  const rawPaper = String(element.dataset.paperSize || "a4").toLowerCase();
  const rawOrientation = String(element.dataset.paperOrientation || "").toLowerCase();
  return {
    element,
    title: String(element.dataset.sectionTitle || "Report"),
    paperSize: rawPaper === "a3" ? "a3" : "a4",
    orientation:
      rawOrientation === "portrait" || rawOrientation === "landscape"
        ? rawOrientation
        : chooseOrientation(element.ownerDocument),
    fitOnePage: String(element.dataset.fitOnePage || "false") === "true",
  };
}

function targetPixelWidth(paperSize: PaperSize, orientation: Orientation): number {
  if (paperSize === "a3") return orientation === "landscape" ? 1587 : 1123;
  return orientation === "landscape" ? 1123 : 794;
}

function injectPdfStyles(
  document: Document,
  orientation: Orientation,
  targetWidth: number
) {
  document.querySelector("style[data-pdf-layout-fix]")?.remove();
  const style = document.createElement("style");
  style.setAttribute("data-pdf-layout-fix", "true");
  style.textContent = `
    html, body {
      width: ${targetWidth}px !important;
      min-width: ${targetWidth}px !important;
      max-width: ${targetWidth}px !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      overflow: visible !important;
    }
    body { font-size: ${orientation === "landscape" ? "11px" : "12px"} !important; line-height: 1.3 !important; }
    .report-document, main, #reactContainer, #contentArea {
      display: block !important;
      width: ${targetWidth}px !important;
      min-width: ${targetWidth}px !important;
      max-width: ${targetWidth}px !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      box-sizing: border-box !important;
    }
    .report-section {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 12px !important;
      overflow: visible !important;
      break-before: auto !important;
      page-break-before: auto !important;
      min-height: 0 !important;
    }
    .section-content { width: 100% !important; max-width: 100% !important; overflow: visible !important; }
    .section-content * { box-sizing: border-box !important; max-width: 100% !important; }
    .report-page-heading, .report-project-line, [data-report-automatic-header="true"] { display: none !important; }
    table {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      font-size: ${orientation === "landscape" ? "8.7px" : "9.4px"} !important;
      line-height: 1.22 !important;
    }
    thead { display: table-header-group !important; }
    tr, td, th, .report-card, .report-kpi-card, [data-report-row], [data-report-item] {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    th, td {
      min-width: 0 !important;
      padding: 5px 6px !important;
      white-space: normal !important;
      overflow: visible !important;
      overflow-wrap: anywhere !important;
      word-break: normal !important;
      vertical-align: top !important;
    }
    .overflow-x-auto, .overflow-auto, [style*="overflow"] { overflow: visible !important; max-height: none !important; }
    img, svg, canvas { max-width: 100% !important; height: auto !important; }
    [data-report-exclude="true"], button, input, select, textarea, form, nav, [role="dialog"] { display: none !important; }
  `;
  document.head.appendChild(style);
}

async function renderSectionCanvas(
  section: PrintableSection,
  documentInFrame: Document,
  iframe: HTMLIFrameElement
): Promise<HTMLCanvasElement> {
  const targetWidth = targetPixelWidth(section.paperSize, section.orientation);
  iframe.style.width = `${targetWidth}px`;
  injectPdfStyles(documentInFrame, section.orientation, targetWidth);

  documentInFrame.querySelectorAll<HTMLElement>("[data-report-page='true']").forEach((page) => {
    page.style.display = page === section.element ? "block" : "none";
  });

  const root = section.element;
  root.style.display = "block";
  root.style.width = `${targetWidth}px`;
  root.style.minWidth = `${targetWidth}px`;
  root.style.maxWidth = `${targetWidth}px`;
  root.style.margin = "0";
  root.style.padding = "12px";
  root.style.overflow = "visible";
  root.style.breakBefore = "auto";
  root.style.pageBreakBefore = "auto";

  await waitForLayout();
  await waitForImages(root);
  const contentHeight = Math.max(root.scrollHeight, root.offsetHeight, 1);
  iframe.style.height = `${contentHeight}px`;
  await waitForLayout();

  const canvas = await html2canvas(root, {
    backgroundColor: "#ffffff",
    scale: section.paperSize === "a3" ? 1.45 : 1.6,
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
  return trimCanvasBottom(canvas);
}

function trimCanvasBottom(source: HTMLCanvasElement): HTMLCanvasElement {
  const context = source.getContext("2d");
  if (!context || source.height < 2) return source;
  const data = context.getImageData(0, 0, source.width, source.height).data;
  let lastContentRow = -1;
  const stepX = Math.max(1, Math.floor(source.width / 500));
  for (let y = source.height - 1; y >= 0; y--) {
    let hasInk = false;
    for (let x = 0; x < source.width; x += stepX) {
      const index = (y * source.width + x) * 4;
      const a = data[index + 3];
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      if (a > 10 && (r < 247 || g < 247 || b < 247)) {
        hasInk = true;
        break;
      }
    }
    if (hasInk) {
      lastContentRow = y;
      break;
    }
  }
  if (lastContentRow < 0 || lastContentRow >= source.height - 4) return source;
  const padding = 12;
  const height = Math.min(source.height, lastContentRow + padding);
  const trimmed = document.createElement("canvas");
  trimmed.width = source.width;
  trimmed.height = Math.max(1, height);
  trimmed.getContext("2d")?.drawImage(source, 0, 0, source.width, height, 0, 0, source.width, height);
  return trimmed;
}

function canvasHasVisiblePixels(canvas: HTMLCanvasElement): boolean {
  const context = canvas.getContext("2d");
  if (!context) return false;
  const width = canvas.width;
  const height = canvas.height;
  const data = context.getImageData(0, 0, width, height).data;
  const stepX = Math.max(1, Math.floor(width / 140));
  const stepY = Math.max(1, Math.floor(height / 140));
  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const i = (y * width + x) * 4;
      if (data[i + 3] > 10 && (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245)) {
        return true;
      }
    }
  }
  return false;
}

function getCanvasRegion(
  element: Element,
  rootRect: DOMRect,
  scaleX: number,
  scaleY: number
): CanvasRegion | null {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
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
    ".materials-report-kpis",
    ".wbs-checklist-print-kpis",
    ".report-card",
    "[data-report-row]",
    "[data-report-item]",
    ".materials-report-panel",
    ".wbs-checklist-status-section",
  ].join(",");
  const breaks = Array.from(root.querySelectorAll<HTMLElement>(selectors))
    .map((element) => (element.getBoundingClientRect().bottom - rootRect.top) * scaleY)
    .filter((value) => Number.isFinite(value) && value > 0)
    .map(Math.round)
    .sort((a, b) => a - b);
  return Array.from(new Set(breaks));
}

function getTableRegions(root: HTMLElement, scaleX: number, scaleY: number): TableRegion[] {
  const rootRect = root.getBoundingClientRect();
  return Array.from(root.querySelectorAll("table"))
    .map((table): TableRegion | null => {
      const tableRegion = getCanvasRegion(table, rootRect, scaleX, scaleY);
      if (!tableRegion) return null;
      const thead = table.querySelector("thead");
      return {
        top: tableRegion.y,
        bottom: tableRegion.y + tableRegion.height,
        header: thead ? getCanvasRegion(thead, rootRect, scaleX, scaleY) : null,
      };
    })
    .filter((value): value is TableRegion => Boolean(value));
}

function findActiveTableHeader(tableRegions: TableRegion[], sourceY: number): CanvasRegion | null {
  const table = tableRegions.find((item) => sourceY > item.top && sourceY < item.bottom);
  return table?.header || null;
}

function findPageEnd(options: {
  sourceY: number;
  maximumEnd: number;
  safeBreaks: number[];
  canvasHeight: number;
}): number {
  const { sourceY, maximumEnd, safeBreaks, canvasHeight } = options;
  if (maximumEnd >= canvasHeight) return canvasHeight;
  const minimumUsefulEnd = sourceY + (maximumEnd - sourceY) * 0.58;
  const candidates = safeBreaks.filter((value) => value > minimumUsefulEnd && value <= maximumEnd);
  return candidates.length ? candidates[candidates.length - 1] : maximumEnd;
}

function drawReportHeader(
  pdf: jsPDF,
  options: {
    headerImageDataUrl?: string;
    projectName: string;
    sectionTitle: string;
    pageWidth: number;
  }
) {
  const left = PAGE_LAYOUT.leftMargin;
  const top = PAGE_LAYOUT.topMargin;
  const availableWidth = options.pageWidth - PAGE_LAYOUT.leftMargin - PAGE_LAYOUT.rightMargin;

  if (options.headerImageDataUrl) {
    try {
      const imageRatio = 749 / 83;
      const maxHeaderWidth = availableWidth * 0.58;
      const maxHeaderHeight = PAGE_LAYOUT.headerImageHeight;
      let headerWidth = maxHeaderWidth;
      let headerHeight = headerWidth / imageRatio;
      if (headerHeight > maxHeaderHeight) {
        headerHeight = maxHeaderHeight;
        headerWidth = headerHeight * imageRatio;
      }
      const headerX = (options.pageWidth - headerWidth) / 2;
      pdf.addImage(
        options.headerImageDataUrl,
        "JPEG",
        headerX,
        top,
        headerWidth,
        headerHeight,
        undefined,
        "FAST"
      );
    } catch {
      // Continue with the text portion if the remote header cannot be loaded.
    }
  }

  const textTop = top + PAGE_LAYOUT.headerImageHeight + 2.5;
  pdf.setTextColor(15, 23, 42);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(options.projectName, left, textTop);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(options.sectionTitle, left, textTop + 5);

  pdf.setDrawColor(30, 64, 175);
  pdf.setLineWidth(0.45);
  pdf.line(left, textTop + 8, options.pageWidth - PAGE_LAYOUT.rightMargin, textTop + 8);
}

function setupReportPage(options: {
  pdf: jsPDF | null;
  useExistingPage: boolean;
  sectionTitle: string;
  orientation: Orientation;
  format: PaperSize;
  headerImageDataUrl?: string;
  companyName: string;
  projectName: string;
}): { pdf: jsPDF; layout: PageLayout } {
  let pdf = options.pdf;
  if (!pdf) {
    pdf = new jsPDF({
      orientation: options.orientation,
      unit: "mm",
      format: options.format,
      compress: true,
    });
  } else if (!options.useExistingPage) {
    pdf.addPage(options.format, options.orientation);
  }

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  drawReportHeader(pdf, {
    headerImageDataUrl: options.headerImageDataUrl,
    projectName: options.projectName,
    sectionTitle: options.sectionTitle,
    pageWidth,
  });

  const contentTop =
    PAGE_LAYOUT.topMargin +
    PAGE_LAYOUT.headerImageHeight +
    PAGE_LAYOUT.headerTextHeight +
    PAGE_LAYOUT.headerGap;
  const contentBottom = pageHeight - PAGE_LAYOUT.bottomMargin - PAGE_LAYOUT.footerHeight;
  return {
    pdf,
    layout: {
      pageWidth,
      pageHeight,
      contentTop,
      contentBottom,
      availableWidth: pageWidth - PAGE_LAYOUT.leftMargin - PAGE_LAYOUT.rightMargin,
      availableHeight: contentBottom - contentTop,
    },
  };
}

async function imageUrlToDataUrl(url: string): Promise<string | undefined> {
  if (!url) return undefined;
  try {
    const response = await fetch(url, { mode: "cors", cache: "force-cache" });
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid image."));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

function addPageNumbers(pdf: jsPDF) {
  const total = pdf.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    pdf.setPage(page);
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Page ${page} of ${total}`, width - PAGE_LAYOUT.rightMargin, height - 7.2, {
      align: "right",
    });
  }
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
    const frameDocument = iframe.contentDocument || iframe.contentWindow?.document;
    if (!frameDocument) throw new Error(`Unable to prepare "${reportTitle}" for PDF generation.`);

    frameDocument.open();
    frameDocument.write(reportHtml);
    frameDocument.close();

    await new Promise<void>((resolve) => {
      if (frameDocument.readyState === "complete" || frameDocument.readyState === "interactive") {
        window.setTimeout(resolve, 400);
      } else {
        iframe.addEventListener("load", () => resolve(), { once: true });
        window.setTimeout(resolve, 2500);
      }
    });

    if (frameDocument.fonts?.ready) {
      await Promise.race([frameDocument.fonts.ready, new Promise((resolve) => window.setTimeout(resolve, 3000))]);
    }
    await waitForImages(frameDocument);

    const body = frameDocument.body;
    const companyName = body.dataset.companyName || "SUWECO TABLAS ENERGY CORPORATION, INC.";
    const projectName = body.dataset.projectName || "Alcantara Diesel Power Plant";
    const headerImageUrl = body.dataset.reportHeaderUrl || OFFICIAL_REPORT_HEADER_URL;
    const headerImageDataUrl = await imageUrlToDataUrl(headerImageUrl);

    const pageElements = Array.from(frameDocument.querySelectorAll<HTMLElement>("[data-report-page='true']"));
    const sections = (pageElements.length
      ? pageElements
      : [frameDocument.querySelector<HTMLElement>(".report-document") || frameDocument.body]
    )
      .filter(hasVisibleContent)
      .map(getSectionSettings);

    let pdf: jsPDF | null = null;
    let pageCount = 0;
    let firstOrientation: Orientation = sections[0]?.orientation || "portrait";

    for (const section of sections) {
      if (!hasVisibleContent(section.element)) continue;
      const canvas = await renderSectionCanvas(section, frameDocument, iframe);
      if (!canvas.width || !canvas.height || !canvasHasVisiblePixels(canvas)) continue;

      const root = section.element;
      const rootRect = root.getBoundingClientRect();
      const scaleX = canvas.width / Math.max(rootRect.width, 1);
      const scaleY = canvas.height / Math.max(rootRect.height, 1);
      const safeBreaks = getSafeBreaks(root, scaleY);
      const tableRegions = getTableRegions(root, scaleX, scaleY);

      if (section.fitOnePage) {
        const page = setupReportPage({
          pdf,
          useExistingPage: pdf === null,
          sectionTitle: section.title,
          orientation: section.orientation,
          format: section.paperSize,
          headerImageDataUrl,
          companyName,
          projectName,
        });
        pdf = page.pdf;
        const { layout } = page;
        const scale = Math.min(
          layout.availableWidth / canvas.width,
          layout.availableHeight / canvas.height
        );
        const width = canvas.width * scale;
        const height = canvas.height * scale;
        const x = PAGE_LAYOUT.leftMargin + (layout.availableWidth - width) / 2;
        const y = layout.contentTop + (layout.availableHeight - height) / 2;
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, width, height, undefined, "FAST");
        pageCount += 1;
        continue;
      }

      let sourceY = 0;
      let sectionPageIndex = 0;
      while (sourceY < canvas.height - 2) {
        const page = setupReportPage({
          pdf,
          useExistingPage: pdf === null,
          sectionTitle: section.title,
          orientation: section.orientation,
          format: section.paperSize,
          headerImageDataUrl,
          companyName,
          projectName,
        });
        pdf = page.pdf;
        const { layout } = page;
        const pixelsPerMillimeter = canvas.width / layout.availableWidth;
        const safetyMm = 3.5;
        const fullPageHeightPx = Math.max(1, Math.floor((layout.availableHeight - safetyMm) * pixelsPerMillimeter));
        const activeHeader = sectionPageIndex > 0 ? findActiveTableHeader(tableRegions, sourceY) : null;
        const repeatedHeight = activeHeader?.height || 0;
        const maximumEnd = Math.min(
          canvas.height,
          sourceY + Math.max(1, fullPageHeightPx - repeatedHeight)
        );
        let endY = findPageEnd({ sourceY, maximumEnd, safeBreaks, canvasHeight: canvas.height });
        if (endY <= sourceY + 4) endY = maximumEnd;
        if (endY < canvas.height) {
          const nextBreak = safeBreaks.find((value) => value >= endY && value - endY <= 8);
          if (nextBreak) endY = Math.min(canvas.height, nextBreak + 2);
        }

        const sliceHeight = Math.max(1, Math.ceil(endY - sourceY));
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = fullPageHeightPx;
        const context = pageCanvas.getContext("2d");
        if (!context) throw new Error(`Unable to create a PDF page for "${reportTitle}".`);
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        let destinationY = 0;
        if (activeHeader) {
          context.drawImage(
            canvas,
            activeHeader.x,
            activeHeader.y,
            activeHeader.width,
            activeHeader.height,
            activeHeader.x,
            destinationY,
            activeHeader.width,
            activeHeader.height
          );
          destinationY += activeHeader.height;
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

        if (!canvasHasVisiblePixels(pageCanvas)) {
          if (pdf.getNumberOfPages() > pageCount) pdf.deletePage(pdf.getNumberOfPages());
          sourceY = endY;
          sectionPageIndex += 1;
          continue;
        }

        pdf.addImage(
          pageCanvas.toDataURL("image/jpeg", 0.95),
          "JPEG",
          PAGE_LAYOUT.leftMargin,
          layout.contentTop,
          layout.availableWidth,
          Math.min(layout.availableHeight, pageCanvas.height / pixelsPerMillimeter),
          undefined,
          "FAST"
        );

        sourceY = endY;
        sectionPageIndex += 1;
        pageCount += 1;
      }
    }

    if (!pdf || pageCount === 0) {
      throw new Error(`The generated PDF for "${reportTitle}" is empty.`);
    }

    addPageNumbers(pdf);
    const blob = pdf.output("blob");
    return {
      filename: `${sanitizeFilename(reportTitle)}.pdf`,
      pdfBase64: await blobToBase64(blob),
      blob,
      orientation: firstOrientation,
      pageCount: pdf.getNumberOfPages(),
    };
  } finally {
    iframe.remove();
  }
}
