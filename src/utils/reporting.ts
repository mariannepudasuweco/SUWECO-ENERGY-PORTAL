import { originalItems } from "../data/wbsChecklistData";

type ModuleReportItem = {
  id: string;
  label: string;
};

type SaveGeneratedReportParams = {
  title: string;
  projectName?: string;
  projectId?: string;
  moduleId?: string;
  moduleName?: string;
  pageName?: string;
  reportScope: "page" | "module";
  html: string;
};

type GenerateCurrentPageReportParams = {
  pageTitle: string;
  moduleTitle: string;
  projectName?: string;
};

type GenerateFullModuleReportParams = {
  moduleId: string;
  moduleTitle: string;
  projectName?: string;
  moduleItems: ModuleReportItem[];
  originalPage: string;
  setActivePage: (page: any) => void;
};

type CapturedSection = {
  title: string;
  html: string;
  paperSize?: "a4" | "a3";
  orientation?: "portrait" | "landscape";
  fitOnePage?: boolean;
};

type CaptureOptions = {
  keepKpis: boolean;
  sectionTitle: string;
  transformClone?: (clone: HTMLElement) => void;
  preserveVisibleLayout?: boolean;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const COMMON_INTERNAL_TAB_LABELS = [
  "All",
  "Paid",
  "Unpaid",
  "Kanban",
  "List",
  "Timeline",
  "Daily",
  "Weekly",
  "Monthly",
  "Schedule (Baseline)",
  "Accomplishment (Actual)",
  "Gantt Chart",
  "Overall Activity View",
  "Weekly Activity View",
  "Dashboard",
  "Masterlist",
  "Transactions",
  "Procurement",
  "Budget",
  "Supplies",
  "Materials",
  "Fuel",
  "Local",
  "Manila",
  "Pending",
  "Completed",
  "Ongoing",
  "Overdue",
  "Approved",
  "Rejected",
  "For Approval",
  "Summary",
  "Details",
];

const EXCLUDED_BUTTON_LABELS = [
  "Add",
  "Edit",
  "Delete",
  "Remove",
  "Save",
  "Cancel",
  "Close",
  "Clear",
  "Clear Filter",
  "Reset",
  "Reset All",
  "Expand All",
  "Collapse All",
  "Print",
  "Export",
  "Generate",
  "Generate Report",
  "Generate Current View",
  "Generate Full Report",
  "Submit",
  "Update",
  "Create",
  "New",
  "Back",
  "Next",
  "Previous",
  "View",
  "Manage",
  "Open",
];

const ACTION_COLUMN_TEXTS = [
  "action",
  "actions",
  "edit",
  "delete",
  "remove",
  "view",
  "manage",
  "controls",
  "control",
  "operation",
  "operations",
  "options",
];

const UI_TEXT_PATTERNS_TO_REMOVE = [
  "manage procurement requests",
  "track procurement expenses",
  "track all charging",
  "track all",
  "manage project inventory and stock movements",
  "track baseline schedule, actual accomplishments, and gantt chart",
  "no equipment usage data available for selected period",
  "grouped by",
  "rows per page",
  "items per page",
  "records per page",
  "showing",
  "generate current view",
  "generate full report",
  "date generated",
  "all months",
  "start date",
  "end date",
  "zoom:",
  "target timeline actual progress",
];

const REPORT_LETTERHEAD_URL =
  "https://res.cloudinary.com/dit5iwj2o/image/upload/v1780583251/sdfdadfassd_tejf8n.jpg";

function escapeHTML(value: unknown): string {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateValue?: Date | string): string {
  const date = dateValue ? new Date(dateValue) : new Date();

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeForCompare(text: string): string {
  return normalizeText(text)
    .toLowerCase()
    .replace(/[-–—]/g, "-")
    .replace(/[^\w\s-]/g, "")
    .trim();
}

function getActiveContentContainer(): HTMLElement | null {
  const reactContainer = document.getElementById("reactContainer");
  const contentArea = document.getElementById("contentArea");

  if (reactContainer && reactContainer.children.length > 0) {
    return reactContainer;
  }

  if (contentArea && contentArea.children.length > 0) {
    return contentArea;
  }

  return reactContainer || contentArea;
}

function isVisibleElement(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);

  if (style.display === "none") return false;
  if (style.visibility === "hidden") return false;
  if (Number(style.opacity) === 0) return false;

  const rect = element.getBoundingClientRect();

  return rect.width > 0 && rect.height > 0;
}

function isExcludedButton(text: string): boolean {
  const cleanText = normalizeText(text).toLowerCase();

  return EXCLUDED_BUTTON_LABELS.some(
    (label) => cleanText === label.toLowerCase()
  );
}

function getInternalTabLabels(container: HTMLElement): string[] {
  const buttons = Array.from(container.querySelectorAll("button"));
  const labels: string[] = [];

  buttons.forEach((button) => {
    const buttonElement = button as HTMLButtonElement;
    const text = normalizeText(
      buttonElement.innerText || buttonElement.textContent || ""
    );

    if (!text) return;
    if (text.length > 45) return;
    if (!isVisibleElement(buttonElement)) return;
    if (isExcludedButton(text)) return;

    const onclickText = buttonElement.getAttribute("onclick") || "";
    const classText = buttonElement.className?.toString() || "";
    const ariaSelected = buttonElement.getAttribute("aria-selected");

    const isKnownTab = COMMON_INTERNAL_TAB_LABELS.some(
      (label) => label.toLowerCase() === text.toLowerCase()
    );

    const looksLikeTab =
      isKnownTab ||
      ariaSelected === "true" ||
      /tab/i.test(onclickText) ||
      /tab/i.test(classText) ||
      /render/i.test(onclickText) ||
      /current.*tab/i.test(onclickText);

    if (!looksLikeTab) return;

    if (!labels.includes(text)) {
      labels.push(text);
    }
  });

  return labels;
}

function clickInternalTabByLabel(container: HTMLElement, label: string): boolean {
  const buttons = Array.from(container.querySelectorAll("button"));

  const targetButton = buttons.find((button) => {
    const buttonElement = button as HTMLButtonElement;
    const text = normalizeText(
      buttonElement.innerText || buttonElement.textContent || ""
    );

    return text.toLowerCase() === label.toLowerCase();
  }) as HTMLButtonElement | undefined;

  if (!targetButton) return false;

  targetButton.click();
  return true;
}

function removePageHeadersAndUITexts(clone: HTMLElement): void {
  clone
    .querySelectorAll(
      [
        ".global-report-actions",
        ".report-actions",
        "[data-report-exclude='true']",
        "nav",
        "aside",
        ".tabs",
        ".tab-list",
        ".page-header",
        ".module-header",
        ".breadcrumb",
        ".pagination",
        ".MuiTablePagination-root",
        ".MuiPagination-root",
      ].join(", ")
    )
    .forEach((el) => el.remove());

  const elements = Array.from(
    clone.querySelectorAll("h1, h2, h3, h4, p, span, div")
  ) as HTMLElement[];

  elements.forEach((element) => {
    if (element.closest("[data-report-preserve='true'], .project-schedule-gantt-report")) return;

    const text = normalizeText(element.textContent || "");

    if (!text) return;

    const lower = text.toLowerCase();

    const isBudgetSummaryTitle =
      lower === "budget summary (month - year)" ||
      lower.includes("budget summary (month - year)");

    if (isBudgetSummaryTitle) {
      return;
    }

    const shouldRemove = UI_TEXT_PATTERNS_TO_REMOVE.some((pattern) =>
      lower.includes(pattern)
    );

    const looksLikePagination =
      /^rows per page/i.test(text) ||
      /^\d+\s*-\s*\d+\s*of\s*\d+$/i.test(text) ||
      /^page\s+\d+\s+of\s+\d+$/i.test(text);

    const looksLikeFilterLabel =
      text.length < 40 &&
      ["month", "status", "filter", "search"].includes(lower);

    if (
      (shouldRemove || looksLikePagination || looksLikeFilterLabel) &&
      text.length < 220
    ) {
      element.remove();
    }
  });
}

function removeControls(clone: HTMLElement): void {
  clone
    .querySelectorAll(
      [
        "button",
        "input",
        "select",
        "textarea",
        "form",
        "script",
        ".modal",
        ".modal-backdrop",
        ".popup",
        ".dropdown",
        "[role='dialog']",
      ].join(", ")
    )
    .forEach((el) => el.remove());

  const clickableElements = Array.from(
    clone.querySelectorAll("[onclick], [role='button']")
  ) as HTMLElement[];

  clickableElements.forEach((element) => {
    const text = normalizeText(element.textContent || "");

    if (!text || isExcludedButton(text) || text.length < 80) {
      element.remove();
    }
  });
}

function removeColumnByIndexes(table: HTMLTableElement, indexes: number[]): void {
  const rows = Array.from(table.querySelectorAll("tr"));

  rows.forEach((row) => {
    const cells = Array.from(row.children);

    indexes
      .slice()
      .sort((a, b) => b - a)
      .forEach((index) => {
        const cell = cells[index];

        if (cell) {
          cell.remove();
        }
      });
  });
}


function removeProjectScheduleBudgetColumns(
  clone: HTMLElement,
  sectionTitle: string
): void {
  const isProjectSchedule = normalizeForCompare(sectionTitle).includes(
    "project schedule"
  );

  if (!isProjectSchedule) return;

  const tables = Array.from(
    clone.querySelectorAll("table")
  ) as HTMLTableElement[];

  tables.forEach((table) => {
    const rows = Array.from(table.querySelectorAll("tr"));

    if (!rows.length) return;

    const headerRow = rows.find((row) =>
      Array.from(row.children).some((cell) =>
        /budget/i.test(normalizeText(cell.textContent || ""))
      )
    );

    if (!headerRow) return;

    const budgetIndexes = Array.from(headerRow.children)
      .map((cell, index) => ({
        index,
        text: normalizeText(cell.textContent || ""),
      }))
      .filter((item) => /budget/i.test(item.text))
      .map((item) => item.index);

    if (budgetIndexes.length) {
      removeColumnByIndexes(table, budgetIndexes);
    }
  });
}

function removeActionAndBlankColumns(clone: HTMLElement): void {
  const tables = Array.from(
    clone.querySelectorAll("table")
  ) as HTMLTableElement[];

  tables.forEach((table) => {
    const rows = Array.from(table.querySelectorAll("tr"));

    if (!rows.length) return;

    const maxColumnCount = Math.max(...rows.map((row) => row.children.length));
    const indexesToRemove: number[] = [];

    for (let columnIndex = 0; columnIndex < maxColumnCount; columnIndex++) {
      const columnTexts = rows.map((row) => {
        const cell = row.children[columnIndex];
        return normalizeText(cell?.textContent || "");
      });

      const headerText = columnTexts[0]?.toLowerCase() || "";
      const bodyTexts = columnTexts.slice(1);
      const bodyHasValue = bodyTexts.some((text) => text.length > 0);

      const isActionHeader = ACTION_COLUMN_TEXTS.includes(headerText);
      const isBlankColumn = !headerText && !bodyHasValue;

      const hasActionTextAnywhere = columnTexts.some((text) =>
        ACTION_COLUMN_TEXTS.includes(text.toLowerCase())
      );

      const hasOnlyActionLikeContent =
        hasActionTextAnywhere &&
        bodyTexts.every((text) => {
          const clean = text.toLowerCase();

          return (
            !clean ||
            ACTION_COLUMN_TEXTS.includes(clean) ||
            clean === "edit" ||
            clean === "delete" ||
            clean === "view"
          );
        });

      if (isActionHeader || isBlankColumn || hasOnlyActionLikeContent) {
        indexesToRemove.push(columnIndex);
      }
    }

    if (indexesToRemove.length) {
      removeColumnByIndexes(table, indexesToRemove);
    }
  });
}

function isKpiLikeElement(element: HTMLElement): boolean {
  const text = normalizeText(element.textContent || "");
  const className = element.className?.toString().toLowerCase() || "";

  if (!text) return false;
  if (text.length > 180) return false;
  if (element.querySelector("table")) return false;

  const hasMoneyOrNumber = /₱|php|%|\d/.test(text.toLowerCase());

  const hasKpiLabel =
    /actual progress|target progress|variance|overall progress|budget utilization|total request|total projected amount|total actual amount|total items|low\s*\/\s*out of stock|fully stocked|total qty\.?\s*in|total qty\.?\s*out|total remaining fuel|allotted budget|total paid|total unpaid|grand total|remaining|budget|paid|unpaid|total|projected amount|actual amount|request|count|amount/i.test(
      text
    );

  const looksLikeCard =
    className.includes("card") ||
    className.includes("shadow") ||
    className.includes("rounded") ||
    className.includes("border") ||
    className.includes("kpi") ||
    className.includes("stat");

  const hasSmallStructure = element.children.length <= 5;

  return hasMoneyOrNumber && hasKpiLabel && (looksLikeCard || hasSmallStructure);
}

function normalizeKpiCards(clone: HTMLElement, keepKpis: boolean): void {
  const possibleKpiContainers = Array.from(
    clone.querySelectorAll("div, section, article")
  ) as HTMLElement[];

  possibleKpiContainers.forEach((container) => {
    const text = normalizeText(container.textContent || "");

    if (!text) return;
    if (container.querySelector("table")) return;
    if (text.length > 1200) return;

    const hasBoqKpis =
      /allotted budget/i.test(text) &&
      /total paid/i.test(text) &&
      /total unpaid/i.test(text) &&
      /grand total/i.test(text) &&
      /remaining/i.test(text);

    const hasProjectScheduleKpis =
      (/actual progress/i.test(text) && /target progress/i.test(text) && /variance/i.test(text)) ||
      (/overall progress/i.test(text) && /budget utilization/i.test(text));

    const hasProcurementKpis =
      /total request/i.test(text) &&
      /total projected amount/i.test(text) &&
      /total actual amount/i.test(text);

    const hasMaterialsKpis =
      /inventory overview/i.test(text) &&
      /total items/i.test(text) &&
      /low\s*\/\s*out of stock/i.test(text) &&
      /fully stocked/i.test(text);

    const hasFuelKpis =
      /summary/i.test(text) &&
      /total qty\.?\s*in/i.test(text) &&
      /total qty\.?\s*out/i.test(text) &&
      /total remaining fuel/i.test(text);

    if (
      !hasBoqKpis &&
      !hasProjectScheduleKpis &&
      !hasProcurementKpis &&
      !hasMaterialsKpis &&
      !hasFuelKpis
    ) {
      return;
    }

    if (!keepKpis) {
      container.remove();
      return;
    }

    if (hasBoqKpis) {
      const allottedMatch = text.match(
        /allotted budget\s*(₱?[\d,.]+(?:\.\d{2})?)/i
      );
      const paidMatch = text.match(
        /total paid\s*(₱?[\d,.]+(?:\.\d{2})?)/i
      );
      const unpaidMatch = text.match(
        /total unpaid\s*(₱?[\d,.]+(?:\.\d{2})?)/i
      );
      const grandTotalMatch = text.match(
        /grand total\s*(₱?[\d,.]+(?:\.\d{2})?)/i
      );
      const remainingMatch = text.match(
        /remaining\s*(₱?-?[\d,.]+(?:\.\d{2})?)/i
      );

      const allotted = allottedMatch?.[1] || "₱0.00";
      const paid = paidMatch?.[1] || "₱0.00";
      const unpaid = unpaidMatch?.[1] || "₱0.00";
      const grandTotal = grandTotalMatch?.[1] || "₱0.00";
      const remaining = remainingMatch?.[1] || "₱0.00";

      container.className = "report-kpi-grid report-kpi-grid-5";
      container.innerHTML = `
        <div class="report-kpi-card">
          <div>Allotted Budget</div>
          <div>${escapeHTML(allotted)}</div>
        </div>

        <div class="report-kpi-card">
          <div>Total Paid</div>
          <div>${escapeHTML(paid)}</div>
        </div>

        <div class="report-kpi-card">
          <div>Total Unpaid</div>
          <div>${escapeHTML(unpaid)}</div>
        </div>

        <div class="report-kpi-card">
          <div>Grand Total</div>
          <div>${escapeHTML(grandTotal)}</div>
        </div>

        <div class="report-kpi-card">
          <div>Remaining</div>
          <div>${escapeHTML(remaining)}</div>
        </div>
      `;

      return;
    }

    if (hasProjectScheduleKpis) {
      const actualMatch = text.match(/actual progress\s*([+-]?[\d,.]+%?)/i);
      const targetMatch = text.match(/target progress\s*([+-]?[\d,.]+%?)/i);
      const varianceMatch = text.match(/variance\s*([+-]?[\d,.]+%?)/i);
      const legacyOverallMatch = text.match(/overall progress\s*([+-]?[\d,.]+%?)/i);

      const actualProgress = actualMatch?.[1] || legacyOverallMatch?.[1] || "0.0%";
      const targetProgress = targetMatch?.[1] || "0.0%";
      const variance = varianceMatch?.[1] || "0.0%";

      container.className = "report-kpi-grid";
      container.innerHTML = `
        <div class="report-kpi-card">
          <div>Actual Progress</div>
          <div>${escapeHTML(actualProgress)}</div>
        </div>

        <div class="report-kpi-card">
          <div>Target Progress</div>
          <div>${escapeHTML(targetProgress)}</div>
        </div>

        <div class="report-kpi-card">
          <div>Variance</div>
          <div>${escapeHTML(variance)}</div>
        </div>
      `;

      return;
    }

    if (hasProcurementKpis) {
      const totalRequestMatch = text.match(/total request\s*([₱\d,.]+)/i);
      const projectedMatch = text.match(
        /total projected amount\s*(₱?[\d,.]+(?:\.\d{2})?)/i
      );
      const actualMatch = text.match(
        /total actual amount\s*(₱?[\d,.]+(?:\.\d{2})?)/i
      );

      const totalRequest = totalRequestMatch?.[1] || "0";
      const projectedAmount = projectedMatch?.[1] || "₱0.00";
      const actualAmount = actualMatch?.[1] || "₱0.00";

      container.className = "report-kpi-grid";
      container.innerHTML = `
        <div class="report-kpi-card">
          <div>Total Request</div>
          <div>${escapeHTML(totalRequest)}</div>
        </div>

        <div class="report-kpi-card">
          <div>Total Projected Amount</div>
          <div>${escapeHTML(projectedAmount)}</div>
        </div>

        <div class="report-kpi-card">
          <div>Total Actual Amount</div>
          <div>${escapeHTML(actualAmount)}</div>
        </div>
      `;

      return;
    }

    if (hasMaterialsKpis) {
      const totalItemsMatch = text.match(/total items\s*(\d+)/i);
      const lowStockMatch = text.match(/low\s*\/\s*out of stock\s*(\d+)/i);
      const fullyStockedMatch = text.match(/fully stocked\s*(\d+)/i);

      const totalItems = totalItemsMatch?.[1] || "0";
      const lowStock = lowStockMatch?.[1] || "0";
      const fullyStocked = fullyStockedMatch?.[1] || "0";

      container.className = "report-kpi-grid";
      container.innerHTML = `
        <div class="report-kpi-card">
          <div>Total Items</div>
          <div>${escapeHTML(totalItems)}</div>
        </div>

        <div class="report-kpi-card">
          <div>Low / Out of Stock</div>
          <div>${escapeHTML(lowStock)}</div>
        </div>

        <div class="report-kpi-card">
          <div>Fully Stocked</div>
          <div>${escapeHTML(fullyStocked)}</div>
        </div>
      `;

      return;
    }

    if (hasFuelKpis) {
      const qtyInMatch = text.match(/total qty\.?\s*in\s*([\d,.]+\s*l?)/i);
      const qtyOutMatch = text.match(/total qty\.?\s*out\s*([\d,.]+\s*l?)/i);
      const remainingMatch = text.match(
        /total remaining fuel\s*([\d,.]+\s*l?)/i
      );

      const totalIn = qtyInMatch?.[1] || "0.0 L";
      const totalOut = qtyOutMatch?.[1] || "0.0 L";
      const remaining = remainingMatch?.[1] || "0.0 L";

      container.className = "report-kpi-grid";
      container.innerHTML = `
        <div class="report-kpi-card">
          <div>Total Qty. In</div>
          <div>${escapeHTML(totalIn)}</div>
        </div>

        <div class="report-kpi-card">
          <div>Total Qty. Out</div>
          <div>${escapeHTML(totalOut)}</div>
        </div>

        <div class="report-kpi-card">
          <div>Total Remaining Fuel</div>
          <div>${escapeHTML(remaining)}</div>
        </div>
      `;

      return;
    }
  });

  const elements = Array.from(clone.querySelectorAll("div")) as HTMLElement[];
  const kpiCards: HTMLElement[] = [];

  elements.forEach((element) => {
    if (element.closest(".report-kpi-grid")) return;

    if (isKpiLikeElement(element)) {
      kpiCards.push(element);
    }
  });

  if (!kpiCards.length) return;

  if (!keepKpis) {
    kpiCards.forEach((card) => card.remove());
    return;
  }

  kpiCards.forEach((card) => {
    card.classList.add("report-kpi-card");
  });

  const parentGroups = new Map<HTMLElement, HTMLElement[]>();

  kpiCards.forEach((card) => {
    const parent = card.parentElement;

    if (!parent) return;

    if (!parentGroups.has(parent)) {
      parentGroups.set(parent, []);
    }

    parentGroups.get(parent)?.push(card);
  });

  parentGroups.forEach((cards, parent) => {
    if (cards.length >= 2) {
      parent.classList.add("report-kpi-grid");
    }
  });
}

function extractSummaryValue(
  text: string,
  startLabel: string,
  nextLabel?: string
): string {
  const pattern = nextLabel
    ? new RegExp(`${startLabel}:\\s*(.*?)\\s*${nextLabel}:`, "i")
    : new RegExp(`${startLabel}:\\s*(.*)$`, "i");

  const match = text.match(pattern);

  return match?.[1]?.trim() || "";
}

function normalizeSummaryBlocks(clone: HTMLElement): void {
  const candidates = Array.from(
    clone.querySelectorAll("div, section, article")
  ) as HTMLElement[];

  candidates.forEach((element) => {
    const text = normalizeText(element.textContent || "");

    if (!text) return;
    if (element.querySelector("table")) return;
    if (text.length > 320) return;

    const hasAllotted = /allotted:/i.test(text);
    const hasPaid = /paid:/i.test(text);
    const hasUnpaid = /unpaid:/i.test(text);
    const hasRemaining = /remaining:/i.test(text);

    if (!(hasAllotted && hasPaid && hasUnpaid && hasRemaining)) return;

    const titlePart = text.split(/allotted:/i)[0]?.trim() || "";
    const title = titlePart.replace(/[:\-\u2013\u2014]\s*$/, "").trim();

    const allotted = extractSummaryValue(text, "Allotted", "Paid");
    const paid = extractSummaryValue(text, "Paid", "Unpaid");
    const unpaid = extractSummaryValue(text, "Unpaid", "Remaining");
    const remaining = extractSummaryValue(text, "Remaining");

    element.className = "report-summary-box";
    element.innerHTML = `
      ${
        title
          ? `<div class="report-summary-title">${escapeHTML(title)}</div>`
          : ""
      }
      <div class="report-summary-line">
        <span><strong>Allotted:</strong> ${escapeHTML(allotted)}</span>
        <span><strong>Paid:</strong> ${escapeHTML(paid)}</span>
        <span><strong>Unpaid:</strong> ${escapeHTML(unpaid)}</span>
        <span><strong>Remaining:</strong> ${escapeHTML(remaining)}</span>
      </div>
    `;
  });
}

function normalizeCharts(clone: HTMLElement, sectionTitle: string): void {
  const isProjectSchedule = normalizeForCompare(sectionTitle).includes("project schedule");
  const chartElements = Array.from(
    clone.querySelectorAll(
      ".recharts-wrapper, .recharts-responsive-container, canvas, svg, [class*='chart'], [class*='Chart'], [class*='gantt'], [class*='Gantt']"
    )
  ) as HTMLElement[];

  chartElements.forEach((chart) => {
    if (isProjectSchedule && chart.closest("[data-report-preserve='true'], .project-schedule-gantt-report")) {
      return;
    }

    const parent = chart.closest("div, section, article") as HTMLElement | null;

    if (parent && !parent.querySelector("table")) {
      parent.remove();
    } else {
      chart.remove();
    }
  });

  const possibleBrokenChartBlocks = Array.from(
    clone.querySelectorAll("div, section, article")
  ) as HTMLElement[];

  possibleBrokenChartBlocks.forEach((element) => {
    if (element.querySelector("table")) return;
    if (isProjectSchedule && element.closest("[data-report-preserve='true'], .project-schedule-gantt-report")) return;

    const text = normalizeText(element.textContent || "").toLowerCase();

    const looksLikeBrokenExpenseChart =
      text.includes("paid") &&
      text.includes("unpaid") &&
      /0\s+8,?333\s+16,?667\s+25,?000/i.test(text);

    const looksLikeBrokenGantt =
      text.includes("target timeline") &&
      text.includes("actual progress") &&
      text.includes("task") &&
      text.includes("jun 2026");

    const looksLikeGanttTaskList =
      text.includes("bidding") &&
      text.includes("procurement") &&
      text.includes("construction") &&
      text.length > 500;

    if (
      looksLikeBrokenExpenseChart ||
      looksLikeBrokenGantt ||
      looksLikeGanttTaskList
    ) {
      element.remove();
    }
  });
}

function removeDuplicateSectionTitlesInsideContent(
  clone: HTMLElement,
  sectionTitle: string
): void {
  const cleanSectionTitle = normalizeForCompare(sectionTitle);

  const headings = Array.from(
    clone.querySelectorAll("h1, h2, h3, h4")
  ) as HTMLElement[];

  headings.forEach((heading) => {
    const text = normalizeForCompare(heading.textContent || "");

    if (text === cleanSectionTitle) {
      heading.remove();
    }
  });
}

function cleanEmptyElements(clone: HTMLElement): void {
  const elements = Array.from(
    clone.querySelectorAll("div, section, article, header, footer")
  ) as HTMLElement[];

  elements.reverse().forEach((element) => {
    if (element.closest("[data-report-preserve='true'], .project-schedule-gantt-report")) return;

    const text = normalizeText(element.textContent || "");
    const hasTable = !!element.querySelector("table");
    const hasImage = !!element.querySelector("img");
    const hasKpi = element.classList.contains("report-kpi-card");

    if (!text && !hasTable && !hasImage && !hasKpi) {
      element.remove();
    }
  });
}

function stripInlineStylesAndDarkClasses(clone: HTMLElement): void {
  clone.querySelectorAll("*").forEach((element) => {
    const htmlElement = element as HTMLElement;

    if (htmlElement.closest("[data-report-preserve='true'], .project-schedule-gantt-report")) {
      return;
    }

    htmlElement.removeAttribute("style");

    const className = htmlElement.className?.toString() || "";

    if (className.includes("dark:")) {
      htmlElement.className = className
        .split(" ")
        .filter((classItem) => !classItem.startsWith("dark:"))
        .join(" ");
    }
  });
}

function removeEmptyScheduleRows(clone: HTMLElement, sectionTitle: string): void {
  const isProjectSchedule =
    normalizeForCompare(sectionTitle).includes("project schedule");

  if (!isProjectSchedule) return;

  const tables = Array.from(
    clone.querySelectorAll("table")
  ) as HTMLTableElement[];

  tables.forEach((table) => {
    const rows = Array.from(table.querySelectorAll("tr"));

    rows.forEach((row, rowIndex) => {
      if (rowIndex === 0) return;

      const cells = Array.from(row.children);
      const rowText = normalizeText(row.textContent || "");
      const lower = rowText.toLowerCase();

      if (!rowText) {
        row.remove();
        return;
      }

      const isCategoryRow =
        cells.length <= 2 &&
        /bidding|procurement|construction|pre-development/i.test(rowText);

      if (isCategoryRow) return;

      const hasBudget = /₱|php/i.test(rowText);
      const hasDate = /\d{4}-\d{2}-\d{2}/.test(rowText);
      const hasImportantStatus = /in progress|completed|ongoing|delayed/i.test(
        rowText
      );

      const isEmptyScheduleRow =
        lower.includes("not started") &&
        !hasBudget &&
        !hasDate &&
        !hasImportantStatus;

      if (isEmptyScheduleRow) {
        row.remove();
      }
    });
  });
}

function fixCategoryRows(clone: HTMLElement): void {
  const tables = Array.from(
    clone.querySelectorAll("table")
  ) as HTMLTableElement[];

  tables.forEach((table) => {
    const headerRow = table.querySelector("tr");

    if (!headerRow) return;

    const columnCount = headerRow.children.length;

    const rows = Array.from(table.querySelectorAll("tr"));

    rows.forEach((row) => {
      const cells = Array.from(row.children) as HTMLTableCellElement[];

      if (!cells.length) return;

      const rowText = normalizeText(row.textContent || "");

      const isCategoryRow =
        cells.length <= 2 &&
        /^(bidding|procurement|construction|pre-development works|pre-development works & other project expenses)$/i.test(
          rowText
        );

      if (!isCategoryRow) return;

      row.innerHTML = "";

      const categoryCell = document.createElement("td");
      categoryCell.colSpan = columnCount;
      categoryCell.textContent = rowText;
      categoryCell.className = "report-category-row";

      row.appendChild(categoryCell);
    });
  });
}

function cleanClonedContent(
  clone: HTMLElement,
  options: {
    keepKpis: boolean;
    sectionTitle: string;
  }
): HTMLElement {
  removePageHeadersAndUITexts(clone);
  removeControls(clone);
  normalizeKpiCards(clone, options.keepKpis);
  normalizeSummaryBlocks(clone);
  normalizeCharts(clone, options.sectionTitle);
  removeEmptyScheduleRows(clone, options.sectionTitle);
  removeProjectScheduleBudgetColumns(clone, options.sectionTitle);
  removeActionAndBlankColumns(clone);
  fixCategoryRows(clone);
  removeDuplicateSectionTitlesInsideContent(clone, options.sectionTitle);
  cleanEmptyElements(clone);
  stripInlineStylesAndDarkClasses(clone);

  return clone;
}


function removeElementsHiddenInSource(source: HTMLElement, clone: HTMLElement): void {
  const sourceChildren = Array.from(source.children) as HTMLElement[];
  const cloneChildren = Array.from(clone.children) as HTMLElement[];

  for (let index = cloneChildren.length - 1; index >= 0; index -= 1) {
    const sourceChild = sourceChildren[index];
    const cloneChild = cloneChildren[index];
    if (!sourceChild || !cloneChild) continue;

    const style = window.getComputedStyle(sourceChild);
    const rect = sourceChild.getBoundingClientRect();
    const hidden =
      style.display === "none" ||
      style.visibility === "hidden" ||
      Number(style.opacity) === 0 ||
      rect.width <= 0 ||
      rect.height <= 0;

    if (hidden) {
      cloneChild.remove();
      continue;
    }

    removeElementsHiddenInSource(sourceChild, cloneChild);
  }
}

function copyCanvasImagesFromSource(source: HTMLElement, clone: HTMLElement): void {
  const sourceCanvases = Array.from(source.querySelectorAll("canvas"));
  const cloneCanvases = Array.from(clone.querySelectorAll("canvas"));

  cloneCanvases.forEach((cloneCanvas, index) => {
    const sourceCanvas = sourceCanvases[index] as HTMLCanvasElement | undefined;
    if (!sourceCanvas) return;

    try {
      const image = document.createElement("img");
      image.src = sourceCanvas.toDataURL("image/png");
      image.alt = sourceCanvas.getAttribute("aria-label") || "Report chart";
      image.style.width = `${sourceCanvas.getBoundingClientRect().width}px`;
      image.style.height = `${sourceCanvas.getBoundingClientRect().height}px`;
      image.style.maxWidth = "100%";
      cloneCanvas.replaceWith(image);
    } catch {
      cloneCanvas.remove();
    }
  });
}

function cleanVisibleLayoutClone(clone: HTMLElement): HTMLElement {
  removeControls(clone);
  clone
    .querySelectorAll("[role='dialog'], [aria-modal='true'], .modal, .tooltip, [data-report-exclude='true']")
    .forEach((element) => element.remove());

  clone.querySelectorAll<HTMLElement>("[style*='position: fixed'], [style*='position:fixed']")
    .forEach((element) => element.remove());

  clone.querySelectorAll<HTMLElement>("[style*='overflow']").forEach((element) => {
    element.style.overflow = "visible";
    element.style.maxHeight = "none";
  });

  return clone;
}

function captureCurrentContentHTML(options: CaptureOptions): string {
  const container = getActiveContentContainer();

  if (!container) {
    return `<div class="empty-section">No content available.</div>`;
  }

  const clone = container.cloneNode(true) as HTMLElement;

  if (options.preserveVisibleLayout) {
    removeElementsHiddenInSource(container, clone);
    copyCanvasImagesFromSource(container, clone);
  }

  if (options.transformClone) {
    options.transformClone(clone);
  }

  const cleanedClone = options.preserveVisibleLayout
    ? cleanVisibleLayoutClone(clone)
    : cleanClonedContent(clone, options);

  return (
    cleanedClone.innerHTML ||
    `<div class="empty-section">No content available.</div>`
  );
}

function sectionHasRealData(html: string): boolean {
  const temp = document.createElement("div");
  temp.innerHTML = html;

  const tables = Array.from(temp.querySelectorAll("table"));

  if (!tables.length) {
    const text = normalizeText(temp.textContent || "").toLowerCase();

    if (!text) return false;
    if (text.includes("no records")) return false;
    if (text.includes("no data")) return false;
    if (text.includes("no report data")) return false;

    return true;
  }

  for (const table of tables) {
    const rows = Array.from(table.querySelectorAll("tr"));

    if (rows.length <= 1) continue;

    const bodyRows = rows.slice(1);

    const hasRealRow = bodyRows.some((row) => {
      const text = normalizeText(row.textContent || "").toLowerCase();

      if (!text) return false;
      if (text.includes("no records")) return false;
      if (text.includes("no data")) return false;
      if (text.includes("no records found")) return false;

      return true;
    });

    if (hasRealRow) {
      return true;
    }
  }

  return false;
}

async function captureCurrentPageSections(
  pageTitle: string,
  includeInternalTabs = false
): Promise<CapturedSection[]> {
  await delay(450);

  const container = getActiveContentContainer();

  if (!container) {
    return [
      {
        title: pageTitle,
        html: `<div class="empty-section">No content available.</div>`,
      },
    ];
  }

  const tabLabels = includeInternalTabs ? getInternalTabLabels(container) : [];

  if (!tabLabels.length) {
    const html = captureCurrentContentHTML({
      keepKpis: true,
      sectionTitle: pageTitle,
    });

    if (!sectionHasRealData(html)) {
      return [];
    }

    return [
      {
        title: pageTitle,
        html,
      },
    ];
  }

  const sections: CapturedSection[] = [];
  let hasKeptKpi = false;

  for (let index = 0; index < tabLabels.length; index++) {
    const tabLabel = tabLabels[index];
    const currentContainer = getActiveContentContainer();

    if (currentContainer) {
      clickInternalTabByLabel(currentContainer, tabLabel);
      await delay(650);
    }

    const sectionTitle = `${pageTitle} - ${tabLabel}`;

    const html = captureCurrentContentHTML({
      keepKpis: !hasKeptKpi,
      sectionTitle,
    });

    if (!sectionHasRealData(html)) {
      continue;
    }

    sections.push({
      title: sectionTitle,
      html,
    });

    hasKeptKpi = true;
  }

  if (tabLabels[0]) {
    const currentContainer = getActiveContentContainer();

    if (currentContainer) {
      clickInternalTabByLabel(currentContainer, tabLabels[0]);
      await delay(150);
    }
  }

  return sections;
}

function detectBestOrientation(
  sections: CapturedSection[]
): "portrait" | "landscape" {
  const allHTML = sections.map((section) => section.html).join("");

  const temp = document.createElement("div");
  temp.innerHTML = allHTML;

  const maxColumnCount = Math.max(
    0,
    ...Array.from(temp.querySelectorAll("tr")).map((row) => row.children.length)
  );

  const tableCount = temp.querySelectorAll("table").length;

  if (temp.querySelector("[data-report-preserve='true'], .project-schedule-gantt-report")) {
    return "landscape";
  }

  if (maxColumnCount >= 7 || tableCount >= 2) {
    return "landscape";
  }

  return "portrait";
}

function shouldShowSectionTitle(
  sectionTitle: string,
  reportTitle: string
): boolean {
  const section = normalizeForCompare(sectionTitle);
  const report = normalizeForCompare(reportTitle);

  if (!section) return false;
  if (section === report) return false;

  return true;
}

async function saveGeneratedReportToSupabase(
  params: SaveGeneratedReportParams
): Promise<void> {
  const supabase = (window as any).supabase;

  if (!supabase) {
    console.error("[Reports] window.supabase is missing.");
    alert("Report was generated but Supabase is not connected.");
    return;
  }

  const now = new Date();
  const datePart = now.toISOString().split("T")[0];

  const safeTitle = params.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const fileName = `${datePart}-${safeTitle}.html`;

  const payload = {
    project_id:
      params.projectId ||
      (window as any).currentProjectId ||
      (window as any).selectedProjectId ||
      null,
    project_name: params.projectName || null,
    module_id: params.moduleId || null,
    module_name: params.moduleName || null,
    page_name: params.pageName || null,
    report_scope: params.reportScope,
    report_title: params.title,
    report_date: datePart,
    generated_at: now.toISOString(),
    report_html: params.html,
    file_name: fileName,
    file_path: null,
    file_url: null,
    created_by: null,
    is_public: false,
  };

  console.log("[Reports] Saving generated report payload:", payload);

  const { data, error } = await supabase
    .from("generated_reports")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[Reports] Failed to save generated report:", error);

    alert(
      `Report was generated but failed to save to Reports page.\n\n${error.message || "Unknown Supabase error"}`
    );

    return;
  }

  console.log("[Reports] Generated report saved successfully:", data);

  window.dispatchEvent(new CustomEvent("generatedReportsUpdated"));
}

function buildCapturedReportHTML(params: {
  title: string;
  projectName?: string;
  sections: CapturedSection[];
  includeAutomaticHeader?: boolean;
}): string {
  const orientation = detectBestOrientation(params.sections);
  const includeAutomaticHeader = params.includeAutomaticHeader !== false;

  const sectionsHTML = params.sections
    .map((section, index) => {
      const sectionOrientation = section.orientation || orientation;
      const sectionPaper = section.paperSize || "a4";
      const pageClass = `${sectionPaper}-${sectionOrientation}`;

      return `
        <section
          class="report-section ${index === 0 ? "first-section" : ""} ${pageClass}"
          data-report-page="true"
          data-paper-size="${sectionPaper}"
          data-paper-orientation="${sectionOrientation}"
          data-fit-one-page="${section.fitOnePage ? "true" : "false"}"
          data-section-title="${escapeHTML(section.title)}"
        >
          <div class="section-content">
            ${section.html}
          </div>
        </section>
      `;
    })
    .join("");

  const automaticHeader = includeAutomaticHeader
    ? `
      <header class="report-header" data-report-automatic-header="true">
        <img
          class="report-letterhead"
          src="${REPORT_LETTERHEAD_URL}"
          alt="SUWECO Letterhead"
        />
        <div class="report-title-row">
          <div class="report-title-left">
            <p class="project-name">${escapeHTML(params.projectName || "Alcantara Diesel Power Plant")}</p>
            <h1 class="report-title">${escapeHTML(params.title.toUpperCase())}</h1>
          </div>
          <div class="report-title-right">
            <p class="date-generated">Date Generated: ${escapeHTML(formatDate(new Date()))}</p>
          </div>
        </div>
      </header>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHTML(params.title)}</title>
        <meta charset="UTF-8" />
        <style>
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            font-family: Aptos, "Segoe UI", Calibri, Arial, sans-serif;
            color: #1f2937;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-variant-numeric: tabular-nums;
          }
          body { font-size: 10px; line-height: 1.35; }
          .report-document { width: 100%; overflow: visible; }
          .report-header { margin: 10mm 10mm 4mm; border-bottom: 1px solid #0f172a; padding-bottom: 3mm; }
          .report-letterhead { display: block; width: 100%; height: 20mm; object-fit: contain; }
          .report-title-row { display: flex; justify-content: space-between; align-items: end; gap: 8mm; }
          .project-name { margin: 0 0 1mm; font-size: 8px; font-weight: 700; text-transform: uppercase; }
          .report-title { margin: 0; font-size: 17px; line-height: 1; text-transform: uppercase; }
          .date-generated { margin: 0; font-size: 8px; white-space: nowrap; }

          .report-section {
            display: block;
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 9mm;
            overflow: visible;
            break-before: auto;
            page-break-before: auto;
          }
          .report-section.first-section {
            break-before: auto;
            page-break-before: auto;
          }
          .section-content { width: 100%; max-width: 100%; overflow: visible !important; }
          .section-content * { box-sizing: border-box !important; max-width: 100%; box-shadow: none !important; text-shadow: none !important; }
          .section-content button,
          .section-content input,
          .section-content select,
          .section-content textarea,
          .section-content form,
          .section-content nav,
          .section-content [data-report-exclude="true"] { display: none !important; }

          .report-page-heading {
            margin: 0 0 4mm;
            padding: 0 0 2mm;
            border-bottom: 1px solid #94a3b8;
            font-size: 14px;
            line-height: 1.2;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            break-after: avoid;
            page-break-after: avoid;
          }
          .report-project-line { margin: -2mm 0 4mm; font-size: 8.5px; color: #64748b; }

          .section-content table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            margin: 0 0 4mm !important;
            font-size: 8px !important;
            line-height: 1.2 !important;
          }
          .section-content thead { display: table-header-group !important; }
          .section-content tfoot { display: table-footer-group !important; }
          .section-content tr { break-inside: avoid !important; page-break-inside: avoid !important; }
          .section-content th,
          .section-content td {
            border: 1px solid #d8dee8 !important;
            padding: 4px 5px !important;
            text-align: left !important;
            vertical-align: top !important;
            white-space: normal !important;
            overflow-wrap: anywhere !important;
            word-break: normal !important;
          }
          .section-content th {
            background: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
          }
          .section-content tbody tr:nth-child(even) td { background: #fafafa !important; }

          .report-kpi-grid,
          .materials-kpi-grid {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 8px !important;
            margin: 0 0 4mm !important;
          }
          .report-kpi-card,
          .materials-kpi-card {
            border: 1px solid #cbd5e1 !important;
            border-top: 3px solid #0f172a !important;
            border-radius: 4px !important;
            padding: 8px !important;
            background: #fff !important;
            min-height: 48px !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .preserve-page-layout {
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
          }
          .preserve-page-layout * { box-sizing: border-box !important; }
          .materials-dashboard-report { display: block !important; width: 100% !important; }
          .materials-dashboard-report .report-panel {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 8px;
            margin: 0 0 4mm;
            break-inside: avoid;
          }
          .materials-dashboard-report .report-two-column {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
            align-items: start !important;
          }


          .materials-dashboard-print { width: 100%; }
          .materials-report-kpis {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 10px !important;
            margin-bottom: 5mm !important;
          }
          .materials-report-kpi {
            border: 1px solid #cbd5e1 !important;
            border-top: 4px solid #0f172a !important;
            border-radius: 6px !important;
            padding: 12px !important;
            min-height: 62px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            break-inside: avoid !important;
          }
          .materials-report-kpi span { font-size: 9px !important; color: #64748b !important; text-transform: uppercase; font-weight: 700; }
          .materials-report-kpi strong { font-size: 22px !important; line-height: 1.1 !important; color: #0f172a !important; margin-top: 4px; }
          .materials-report-panel { margin: 0 0 5mm !important; }
          .materials-report-panel h3 {
            margin: 0 0 2mm !important;
            padding: 0 0 1.5mm !important;
            border-bottom: 1px solid #94a3b8 !important;
            font-size: 12px !important;
            color: #0f172a !important;
            break-after: avoid !important;
          }
          .materials-full-stock-table { break-before: page; page-break-before: always; }
          .wbs-sequence-image-report {
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            align-items: flex-start !important;
            justify-content: center !important;
            overflow: hidden !important;
          }
          .wbs-sequence-image-report img {
            display: block !important;
            width: 100% !important;
            height: auto !important;
            max-width: 100% !important;
            object-fit: contain !important;
          }

          .wbs-checklist-report table { font-size: 8.2px !important; }
          .wbs-checklist-report .wbs-level-0 { padding-left: 5px !important; font-weight: 800 !important; }
          .wbs-checklist-report .wbs-level-1 { padding-left: 14px !important; font-weight: 700 !important; }
          .wbs-checklist-report .wbs-level-2 { padding-left: 24px !important; }
          .wbs-checklist-report .wbs-level-3 { padding-left: 34px !important; }
          .wbs-status-cell {
            text-align: center !important;
            vertical-align: middle !important;
            padding-top: 3px !important;
            padding-bottom: 3px !important;
          }
          .status-pill {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-width: 72px !important;
            height: 18px !important;
            border-radius: 999px !important;
            padding: 0 7px !important;
            white-space: nowrap !important;
            font-size: 7.4px !important;
            font-weight: 800 !important;
            line-height: 1 !important;
            vertical-align: middle !important;
            box-sizing: border-box !important;
          }
          .status-completed { background: #dcfce7 !important; color: #166534 !important; border: 1px solid #86efac !important; }
          .status-in-progress { background: #dbeafe !important; color: #1d4ed8 !important; border: 1px solid #93c5fd !important; }
          .status-pending { background: #fef3c7 !important; color: #92400e !important; border: 1px solid #fcd34d !important; }
          .status-not-yet-started { background: #f1f5f9 !important; color: #475569 !important; border: 1px solid #cbd5e1 !important; }

          .wbs-checklist-print-kpis {
            display: grid !important;
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
            gap: 8px !important;
            margin: 0 0 5mm !important;
          }
          .wbs-checklist-print-kpi {
            min-height: 58px !important;
            border: 1px solid #cbd5e1 !important;
            border-top: 4px solid #0f172a !important;
            border-radius: 5px !important;
            padding: 8px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            break-inside: avoid !important;
          }
          .wbs-checklist-print-kpi span { font-size: 8px !important; font-weight: 700 !important; text-transform: uppercase; color: #64748b !important; }
          .wbs-checklist-print-kpi strong { margin-top: 3px; font-size: 20px !important; line-height: 1 !important; color: #0f172a !important; }
          .wbs-checklist-status-section { margin: 0 0 5mm !important; }
          .wbs-checklist-status-section h3 {
            margin: 0 0 2mm !important;
            padding: 2.5mm 3mm !important;
            border-left: 4px solid #1e40af !important;
            background: #eff6ff !important;
            font-size: 11px !important;
            line-height: 1.2 !important;
            break-after: avoid !important;
          }
          .wbs-checklist-status-section.status-completed-section h3 { border-left-color: #16a34a !important; background: #f0fdf4 !important; }
          .wbs-checklist-status-section.status-in-progress-section h3 { border-left-color: #2563eb !important; background: #eff6ff !important; }
          .wbs-checklist-status-section.status-pending-section h3 { border-left-color: #d97706 !important; background: #fffbeb !important; }
          .wbs-checklist-status-section.status-not-yet-started-section h3 { border-left-color: #64748b !important; background: #f8fafc !important; }
          .wbs-checklist-print-table col.code { width: 14%; }
          .wbs-checklist-print-table col.title { width: 46%; }
          .wbs-checklist-print-table col.status { width: 14%; }
          .wbs-checklist-print-table col.assignee { width: 16%; }
          .wbs-checklist-print-table col.due { width: 10%; }
          .wbs-group-row td { background: #e2e8f0 !important; font-weight: 800 !important; }
          .wbs-parent-row td { background: #f8fafc !important; font-weight: 700 !important; }
          .wbs-task-title.level-1 { padding-left: 12px !important; }
          .wbs-task-title.level-2 { padding-left: 24px !important; }
          .wbs-task-title.level-3 { padding-left: 36px !important; }

          .wbs-sequence-report {
            width: 100% !important;
            overflow: visible !important;
          }
          .wbs-sequence-report svg,
          .wbs-sequence-report canvas,
          .wbs-sequence-report img { max-width: 100% !important; height: auto !important; }
          .wbs-sequence-report [style*="overflow"] { overflow: visible !important; }

          @page a4-portrait { size: A4 portrait; margin: 0; }
          @page a4-landscape { size: A4 landscape; margin: 0; }
          @page a3-landscape { size: A3 landscape; margin: 0; }
          .a4-portrait { page: a4-portrait; }
          .a4-landscape { page: a4-landscape; }
          .a3-landscape { page: a3-landscape; }

          @media print {
            body { margin: 0; padding: 0; }
            .report-section { min-height: 1px; }
          }
          @media screen {
            body { max-width: 1400px; margin: 0 auto; background: #e5e7eb; }
            .report-section { background: #fff; margin: 12px auto; }
          }
        </style>
      </head>
      <body
        data-report-header-url="${REPORT_LETTERHEAD_URL}"
        data-company-name="SUWECO TABLAS ENERGY CORPORATION, INC."
        data-project-name="${escapeHTML(params.projectName || "Alcantara Diesel Power Plant")}"
      >
        <div class="report-document">
          ${automaticHeader}
          ${sectionsHTML}
        </div>
      </body>
    </html>
  `;
}

function printCapturedReportHTML(html: string): void {
  const printWindow = window.open("", "_blank", "width=1200,height=800");

  if (!printWindow) {
    alert("Please allow pop-ups to generate the report.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export async function generateCurrentPageReport(
  params: GenerateCurrentPageReportParams
): Promise<void> {
  const sections = await captureCurrentPageSections(params.pageTitle, false);

  if (!sections.length) {
    alert("No report data available for this page.");
    return;
  }

  const html = buildCapturedReportHTML({
    title: params.pageTitle,
    projectName: params.projectName,
    sections,
  });

  await saveGeneratedReportToSupabase({
    title: params.pageTitle,
    projectName: params.projectName,
    pageName: params.pageTitle,
    moduleName: params.moduleTitle,
    reportScope: "page",
    html,
  });

  printCapturedReportHTML(html);
}

type LegacyRecord = Record<string, any>;

function valueOf(record: LegacyRecord, ...keys: string[]): any {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return "";
}

function cleanValue(value: unknown): string {
  const text = String(value ?? "").trim();
  return text && text !== "null" && text !== "undefined" ? text : "";
}

function recordBelongsToCurrentProject(record: LegacyRecord): boolean {
  const currentProjectId = String(
    (window as any).currentProjectId ||
      (window as any).selectedProjectId ||
      ""
  );
  if (!currentProjectId) return true;
  const rowProjectId = String(valueOf(record, "projectId", "project_id") || "");
  return !rowProjectId || rowProjectId === currentProjectId;
}

function lookupPrsNo(record: LegacyRecord): string {
  const direct = cleanValue(valueOf(record, "prsNo", "prs_no"));
  if (direct) return direct;

  const prsId = String(valueOf(record, "prsId", "request_id", "prs_id") || "");
  if (!prsId) return "";

  const prsRows = ((window as any).prsRecords || []) as LegacyRecord[];
  const match = prsRows.find((row) =>
    [row.id, row.request_id, row.prsId].some((candidate) => String(candidate || "") === prsId)
  );

  return cleanValue(valueOf(match || {}, "prsNo", "prs_no"));
}

function isDeliveredRecord(record: LegacyRecord): boolean {
  const deliveryDate = cleanValue(
    valueOf(record, "dateDelivered", "date_delivered", "deliveryDate", "delivery_date")
  );
  const status = cleanValue(
    valueOf(
      record,
      "procurementStatus",
      "procurement_status",
      "deliveryStatus",
      "delivery_status",
      "status"
    )
  ).toLowerCase();

  return Boolean(deliveryDate) ||
    status === "delivered" ||
    status === "completed" ||
    status.includes("fully delivered");
}

function reportHeading(title: string, projectName?: string): string {
  return `
    <div class="report-page-heading">${escapeHTML(title)}</div>
    ${projectName ? `<div class="report-project-line">${escapeHTML(projectName)}</div>` : ""}
  `;
}

function renderReportTable(headers: string[], rows: string[][], emptyText: string): string {
  return `
    <table data-report-table="true">
      <thead><tr>${headers.map((header) => `<th>${escapeHTML(header)}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.length
          ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHTML(cell || "-")}</td>`).join("")}</tr>`).join("")
          : `<tr><td colspan="${headers.length}">${escapeHTML(emptyText)}</td></tr>`}
      </tbody>
    </table>
  `;
}

function buildManilaSourceReport(projectName?: string): string {
  const source = (((window as any).manilaRecords || []) as LegacyRecord[])
    .filter(recordBelongsToCurrentProject);

  const rows = source
    .filter((row) => {
      const hasPrsNo = lookupPrsNo(row) !== "";
      return hasPrsNo && !isDeliveredRecord(row);
    })
    .map((row) => [
      cleanValue(valueOf(row, "process")),
      cleanValue(valueOf(row, "designation")),
      lookupPrsNo(row),
      cleanValue(valueOf(row, "item", "itemParticulars", "item_particulars")),
      cleanValue(valueOf(row, "prsDate", "prs_date")),
      cleanValue(valueOf(row, "subtaskCharging", "subtask_charging")),
      cleanValue(valueOf(row, "poNo", "po_no")),
      cleanValue(valueOf(row, "supplier")),
      cleanValue(valueOf(row, "targetDate", "target_date")),
      cleanValue(valueOf(row, "procurementStatus", "procurement_status", "status")),
      cleanValue(valueOf(row, "currentDepartment", "current_department")),
      cleanValue(valueOf(row, "remarks")),
    ]);

  return `${reportHeading("Manila Procurement - Undelivered with PRS No.", projectName)}${renderReportTable(
    ["Process", "Designation", "PRS No.", "Item / Particulars", "PRS Date", "Subtask Charging", "PO No.", "Supplier", "Target Date", "Status", "Department", "Remarks"],
    rows,
    "No undelivered Manila Procurement records with a valid PRS number."
  )}`;
}

function isLocalSupplyRecord(record: LegacyRecord): boolean {
  const category = cleanValue(
    valueOf(record, "category", "procurementType", "procurement_type", "tab", "repleCategory", "reple_category")
  ).toLowerCase();

  return category === "supplies" ||
    category === "supply" ||
    category.includes("suppl") ||
    category.includes("material");
}

function buildLocalSourceReport(projectName?: string): string {
  const source = (((window as any).localRecords || []) as LegacyRecord[])
    .filter(recordBelongsToCurrentProject);

  const rows = source
    .filter((row) => isLocalSupplyRecord(row) && !isDeliveredRecord(row))
    .map((row) => [
      cleanValue(valueOf(row, "process")),
      cleanValue(valueOf(row, "repleCategory", "reple_category", "category")),
      cleanValue(valueOf(row, "repleNo", "reple_no")),
      lookupPrsNo(row),
      cleanValue(valueOf(row, "poNo", "po_no")),
      cleanValue(valueOf(row, "supplier")),
      cleanValue(valueOf(row, "targetDate", "target_date")),
      cleanValue(valueOf(row, "procurementStatus", "procurement_status", "status")),
      cleanValue(valueOf(row, "currentDepartment", "current_department")),
      cleanValue(valueOf(row, "concerns", "remarks")),
    ]);

  return `${reportHeading("Local Procurement - Supplies - Undelivered", projectName)}${renderReportTable(
    ["Process", "Category", "REPLE No.", "PRS No.", "PO No.", "Supplier", "Target Date", "Status", "Department", "Remarks / Concerns"],
    rows,
    "No undelivered Local Procurement supply records."
  )}`;
}

function buildMaterialsDashboardReport(projectName?: string): string {
  const source = (((window as any).materialsMasterlist || []) as LegacyRecord[])
    .filter(recordBelongsToCurrentProject);
  const transactions = (((window as any).materialTransactions ||
    (window as any).materialsTransactions || []) as LegacyRecord[])
    .filter(recordBelongsToCurrentProject);

  const transactionMaterialIds = new Set(
    transactions
      .map((row) => cleanValue(valueOf(row, "materialId", "material_id")))
      .filter(Boolean)
  );
  const transactionItemCodes = new Set(
    transactions
      .map((row) => cleanValue(valueOf(row, "itemCode", "item_code")))
      .filter(Boolean)
  );

  const normalized = source
    .map((row) => {
      const id = cleanValue(valueOf(row, "id", "materialId", "material_id"));
      const itemCode = cleanValue(valueOf(row, "itemCode", "item_code"));
      const hasTransaction =
        (id !== "" && transactionMaterialIds.has(id)) ||
        (itemCode !== "" && transactionItemCodes.has(itemCode));
      const currentStock = Number(valueOf(row, "currentStock", "current_stock") || 0);
      const minimumStock = Number(valueOf(row, "minStock", "minimumStock", "minimum_stock") || 0);

      return {
        id,
        itemCode,
        itemName: cleanValue(valueOf(row, "itemName", "item_name")),
        department: cleanValue(valueOf(row, "department")),
        type: cleanValue(valueOf(row, "type")),
        unit: cleanValue(valueOf(row, "unit")),
        currentStock,
        minimumStock,
        hasTransaction,
        status: currentStock <= minimumStock ? "Low / Out of Stock" : "Fully Stocked",
      };
    })
    .filter((row) => row.hasTransaction);

  const lowStock = normalized.filter((row) => row.currentStock <= row.minimumStock);
  const fullyStocked = normalized.filter((row) => row.currentStock > row.minimumStock);

  const departmentNames = Array.from(
    new Set(normalized.map((row) => row.department || "Unspecified"))
  ).sort((a, b) => a.localeCompare(b));

  const departmentRows = departmentNames.map((department) => {
    const rows = normalized.filter((row) => (row.department || "Unspecified") === department);
    return [
      department,
      String(rows.length),
      String(rows.filter((row) => row.currentStock <= row.minimumStock).length),
      String(rows.filter((row) => row.currentStock > row.minimumStock).length),
    ];
  });

  const toRows = (rows: typeof normalized) => rows.map((row) => [
    row.itemCode,
    row.itemName,
    row.department,
    row.type,
    String(row.currentStock),
    String(row.minimumStock),
    row.unit,
    row.status,
  ]);

  return `${reportHeading("Materials Dashboard", projectName)}
    <div class="materials-dashboard-print">
      <div class="materials-report-kpis">
        <div class="materials-report-kpi"><span>Total Items with Transactions</span><strong>${normalized.length}</strong></div>
        <div class="materials-report-kpi"><span>Low / Out of Stock</span><strong>${lowStock.length}</strong></div>
        <div class="materials-report-kpi"><span>Fully Stocked</span><strong>${fullyStocked.length}</strong></div>
      </div>
      <div class="materials-report-panel">
        <h3>Stock Summary by Department</h3>
        ${renderReportTable(["Department", "Total Items", "Low / Out", "Fully Stocked"], departmentRows, "No transaction-backed material records are available.")}
      </div>
      <div class="materials-report-panel">
        <h3>Low Stock / Out of Stock Items</h3>
        ${renderReportTable(["Item Code", "Item Name", "Department", "Type", "Current Stock", "Minimum Stock", "Unit", "Status"], toRows(lowStock), "No transaction-backed low-stock or out-of-stock items.")}
      </div>
    </div>`;
}

function normalizeChecklistReportStatus(value: unknown): "Completed" | "In Progress" | "Pending" | "Not Yet Started" {
  const status = String(value || "").trim().toLowerCase();
  if (status.includes("complete") || status === "done") return "Completed";
  if (status.includes("progress") || status.includes("ongoing")) return "In Progress";
  if (status.includes("pending")) return "Pending";
  return "Not Yet Started";
}

function buildWbsChecklistSourceReport(projectName?: string): string {
  const liveRows = ((window as any).wbsChecklistReportData || []) as any[];
  const sourceRows = liveRows.length
    ? liveRows
    : originalItems.map((item: any) => ({
        code: item.item_no || item.id || "",
        title: item.item || "",
        status: item.status || (item.checked ? "Completed" : "Not Yet Started"),
        assignee: item.department || "",
        dueDate: item.due_date || "",
        phase: item.requirement || "Uncategorized",
        category: item.section || "General",
        parentTask: item.subsection || "",
      }));

  const rows = sourceRows
    .map((row) => ({
      code: cleanValue(row.code),
      title: cleanValue(row.title),
      status: normalizeChecklistReportStatus(row.status),
      assignee: cleanValue(row.assignee),
      dueDate: cleanValue(row.dueDate),
      phase: cleanValue(row.phase) || "Uncategorized",
      category: cleanValue(row.category) || "General",
      parentTask: cleanValue(row.parentTask),
    }))
    .filter((row) => row.title !== "");

  const statusOrder = ["Completed", "In Progress", "Pending", "Not Yet Started"] as const;
  const count = (status: typeof statusOrder[number]) => rows.filter((row) => row.status === status).length;

  const renderStatusSection = (status: typeof statusOrder[number]) => {
    const statusRows = rows.filter((row) => row.status === status);
    if (!statusRows.length) return "";

    if (status === "Not Yet Started") {
      const grouped = new Map<string, { phase: string; category: string; parentTask: string; count: number }>();
      statusRows.forEach((row) => {
        const key = [row.phase, row.category, row.parentTask].join("|");
        const current = grouped.get(key);
        if (current) current.count += 1;
        else grouped.set(key, { phase: row.phase, category: row.category, parentTask: row.parentTask, count: 1 });
      });
      const summaryRows = Array.from(grouped.values()).map((group) => `
        <tr data-report-row="true">
          <td>-</td>
          <td class="wbs-task-title level-1">${escapeHTML([group.phase, group.category, group.parentTask].filter(Boolean).join(" / "))}</td>
          <td class="wbs-status-cell"><span class="status-pill status-not-yet-started">Not Yet Started</span></td>
          <td>-</td>
          <td>${group.count} item${group.count === 1 ? "" : "s"}</td>
        </tr>`).join("");
      return `<div class="wbs-checklist-status-section status-not-yet-started-section" data-report-item="true">
        <h3>Not Yet Started Items (Collapsed Summary)</h3>
        <table class="wbs-checklist-print-table" data-report-table="true">
          <colgroup><col class="code"/><col class="title"/><col class="status"/><col class="assignee"/><col class="due"/></colgroup>
          <thead><tr><th>WBS Code</th><th>Phase / Category / Parent Task</th><th>Status</th><th>Responsible Person</th><th>Count</th></tr></thead>
          <tbody>${summaryRows}</tbody>
        </table>
      </div>`;
    }

    let lastPhase = "";
    let lastCategory = "";
    let lastParentTask = "";
    const body: string[] = [];

    statusRows.forEach((row) => {
      if (row.phase !== lastPhase) {
        body.push(`<tr class="wbs-group-row"><td colspan="5">${escapeHTML(row.phase)}</td></tr>`);
        lastPhase = row.phase;
        lastCategory = "";
        lastParentTask = "";
      }
      if (row.category !== lastCategory) {
        body.push(`<tr class="wbs-parent-row"><td></td><td colspan="4" class="wbs-task-title level-1">${escapeHTML(row.category)}</td></tr>`);
        lastCategory = row.category;
        lastParentTask = "";
      }
      if (row.parentTask && row.parentTask !== lastParentTask) {
        body.push(`<tr class="wbs-parent-row"><td></td><td colspan="4" class="wbs-task-title level-2">${escapeHTML(row.parentTask)}</td></tr>`);
        lastParentTask = row.parentTask;
      }
      body.push(`<tr data-report-row="true">
        <td>${escapeHTML(row.code || "-")}</td>
        <td class="wbs-task-title level-3">${escapeHTML(row.title)}</td>
        <td class="wbs-status-cell"><span class="status-pill status-${row.status.toLowerCase().replace(/\s+/g, "-")}">${escapeHTML(row.status)}</span></td>
        <td>${escapeHTML(row.assignee || "-")}</td>
        <td>${escapeHTML(row.dueDate || "-")}</td>
      </tr>`);
    });

    const statusClass = status.toLowerCase().replace(/\s+/g, "-");
    return `<div class="wbs-checklist-status-section status-${statusClass}-section" data-report-item="true">
      <h3>${escapeHTML(status)} Items</h3>
      <table class="wbs-checklist-print-table" data-report-table="true">
        <colgroup><col class="code"/><col class="title"/><col class="status"/><col class="assignee"/><col class="due"/></colgroup>
        <thead><tr><th>WBS Code</th><th>Task / Activity</th><th>Status</th><th>Responsible Person</th><th>Due Date</th></tr></thead>
        <tbody>${body.join("")}</tbody>
      </table>
    </div>`;
  };

  return `${reportHeading("WBS Checklist", projectName)}
    <div class="wbs-checklist-print-report">
      <div class="wbs-checklist-print-kpis" data-report-item="true">
        <div class="wbs-checklist-print-kpi"><span>Total Items</span><strong>${rows.length}</strong></div>
        <div class="wbs-checklist-print-kpi"><span>Completed</span><strong>${count("Completed")}</strong></div>
        <div class="wbs-checklist-print-kpi"><span>In Progress</span><strong>${count("In Progress")}</strong></div>
        <div class="wbs-checklist-print-kpi"><span>Pending</span><strong>${count("Pending")}</strong></div>
        <div class="wbs-checklist-print-kpi"><span>Not Yet Started</span><strong>${count("Not Yet Started")}</strong></div>
      </div>
      ${statusOrder.map(renderStatusSection).join("")}
    </div>`;
}

async function buildWbsSequenceImageReport(projectName?: string): Promise<string> {
  const capture = (window as any).captureWbsSequenceForFullReport;
  if (typeof capture !== "function") {
    throw new Error("WBS Sequence report capture is not available.");
  }

  const result = await capture();
  const dataUrl = typeof result === "string" ? result : result?.dataUrl;
  if (!dataUrl) {
    throw new Error("WBS Sequence report capture returned no image.");
  }

  return `<div class="wbs-sequence-image-report">
      <img src="${dataUrl}" alt="WBS Sequence" />
    </div>`;
}

function transformExpenseOverview(clone: HTMLElement): void {
  const candidates = Array.from(clone.querySelectorAll<HTMLElement>("div, section, article"));

  candidates.forEach((element) => {
    if (element.closest("table")) return;

    const text = normalizeText(element.innerText || element.textContent || "");
    const lower = text.toLowerCase();
    const hasPaidUnpaidLabels = /(^|\s)paid(\s|$)/i.test(text) && /(^|\s)unpaid(\s|$)/i.test(text);
    const hasRawScaleNumbers = /0\s+[\d,]+\s+[\d,]+\s+[\d,]+/.test(text);
    const isCompactBlock = text.length > 0 && text.length < 220;

    if (hasPaidUnpaidLabels && hasRawScaleNumbers && isCompactBlock) {
      element.remove();
    }
  });
}

function transformMaterialsDashboard(clone: HTMLElement): void {
  clone.classList.add("materials-dashboard-report", "preserve-page-layout");
  clone.querySelectorAll("button, input, select, textarea, form, nav, [role='dialog']")
    .forEach((element) => element.remove());
  clone.querySelectorAll<HTMLElement>("[style*='position: fixed'], [style*='position:fixed']")
    .forEach((element) => element.remove());
}

function transformCoordination(clone: HTMLElement): void {
  clone.classList.add("coordination-report");
  clone.querySelectorAll("button, input, select, textarea, form, nav, [role='dialog']").forEach((el) => el.remove());
  clone.querySelectorAll("[style*='max-height']").forEach((el) => (el as HTMLElement).style.maxHeight = "none");
  clone.querySelectorAll("[style*='overflow']").forEach((el) => (el as HTMLElement).style.overflow = "visible");
}

function transformWbsSequence(clone: HTMLElement): void {
  clone.classList.add("wbs-sequence-report", "preserve-page-layout");
  clone.querySelectorAll("button, input, select, textarea, form, nav, [role='dialog']")
    .forEach((element) => element.remove());
  clone.querySelectorAll<HTMLElement>("[style*='position: fixed'], [style*='position:fixed']")
    .forEach((element) => element.remove());
}

function transformWbsChecklist(clone: HTMLElement): void {
  clone.classList.add("wbs-checklist-report");
  clone.querySelectorAll("button, input, select, textarea, form, nav, [role='dialog']").forEach((el) => el.remove());
  clone.querySelectorAll("[style*='max-height']").forEach((el) => (el as HTMLElement).style.maxHeight = "none");
  clone.querySelectorAll("[style*='overflow']").forEach((el) => (el as HTMLElement).style.overflow = "visible");
}

async function waitForActivePageReady(options: {
  timeoutMs?: number;
  requireTableRows?: boolean;
  disallowText?: string[];
} = {}): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 15000;
  const disallow = (options.disallowText || ["loading", "please wait"]).map((value) => value.toLowerCase());
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const container = getActiveContentContainer();
    if (container) {
      const text = normalizeText(container.innerText || container.textContent || "").toLowerCase();
      const hasLoadingText = disallow.some((value) => text.includes(value));
      const dataRows = container.querySelectorAll("tbody tr").length;
      const hasUsefulContent = text.length > 40 || container.querySelectorAll("canvas, svg, img, [data-report-item]").length > 0;
      const rowsReady = !options.requireTableRows || dataRows > 0;
      if (!hasLoadingText && hasUsefulContent && rowsReady) return;
    }
    await delay(300);
  }
}

async function waitForWindowArray(name: string, timeoutMs = 8000): Promise<any[]> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = (window as any)[name];
    if (Array.isArray(value) && value.length > 0) return value;
    await delay(250);
  }
  const value = (window as any)[name];
  return Array.isArray(value) ? value : [];
}

export async function generateFullModuleReport(
  params: GenerateFullModuleReportParams
): Promise<void> {
  const sections: CapturedSection[] = [];

  const capturePage = async (spec: {
    pageId: string;
    title: string;
    prepare?: () => void | Promise<void>;
    transformClone?: (clone: HTMLElement) => void;
    preserveVisibleLayout?: boolean;
    paperSize?: "a4" | "a3";
    orientation?: "portrait" | "landscape";
    cleanup?: () => void | Promise<void>;
  }) => {
    params.setActivePage(spec.pageId);
    await delay(500);
    await waitForActivePageReady({ timeoutMs: 15000 });
    if (spec.prepare) {
      await spec.prepare();
      await delay(700);
    }

    const html = captureCurrentContentHTML({
      keepKpis: true,
      sectionTitle: spec.title,
      transformClone: spec.transformClone,
      preserveVisibleLayout: spec.preserveVisibleLayout,
    });

    if (sectionHasRealData(html)) {
      sections.push({
        title: spec.title,
        html: `${reportHeading(spec.title, params.projectName)}${html}`,
        paperSize: spec.paperSize || "a4",
        orientation: spec.orientation,
      });
    }

    if (spec.cleanup) await spec.cleanup();
  };

  try {
    await capturePage({
      pageId: "expense-overview",
      title: "Expense Overview",
      orientation: "landscape",
      transformClone: transformExpenseOverview,
    });

    // Load the actual module pages first so the global source arrays are current.
    params.setActivePage("manila");
    await waitForActivePageReady({ timeoutMs: 15000 });
    await waitForWindowArray("manilaRecords", 12000);
    sections.push({
      title: "Manila Procurement",
      html: buildManilaSourceReport(params.projectName),
      paperSize: "a4",
      orientation: "landscape",
    });

    params.setActivePage("local");
    await waitForActivePageReady({ timeoutMs: 15000 });
    await waitForWindowArray("localRecords", 12000);
    sections.push({
      title: "Local Procurement - Supplies",
      html: buildLocalSourceReport(params.projectName),
      paperSize: "a4",
      orientation: "landscape",
    });

    params.setActivePage("materials");
    await delay(900);
    const setMaterialsTab = (window as any).setMaterialsTab;
    if (typeof setMaterialsTab === "function") setMaterialsTab("dashboard");
    await delay(500);
    sections.push({
      title: "Materials Dashboard",
      html: buildMaterialsDashboardReport(params.projectName),
      paperSize: "a4",
      orientation: "landscape",
    });

    await capturePage({ pageId: "fuel", title: "Fuel", orientation: "landscape" });
    await capturePage({ pageId: "project-schedule", title: "Project Schedule", orientation: "landscape" });
    params.setActivePage("wbs-sequence");
    await delay(1200);
    sections.push({
      title: "WBS Sequence",
      html: await buildWbsSequenceImageReport(params.projectName),
      paperSize: "a3",
      orientation: "landscape",
      fitOnePage: true,
    });
    params.setActivePage("wbs-checklist");
    await delay(900);
    window.dispatchEvent(
      new CustomEvent("prepareWbsChecklistFullReport", { detail: { enabled: true } })
    );
    await waitForWindowArray("wbsChecklistReportData", 10000);
    await delay(450);
    const checklistHtml = buildWbsChecklistSourceReport(params.projectName);
    if (sectionHasRealData(checklistHtml)) {
      sections.push({
        title: "WBS Checklist",
        html: checklistHtml,
        paperSize: "a4",
        orientation: "landscape",
      });
    }
    window.dispatchEvent(
      new CustomEvent("prepareWbsChecklistFullReport", { detail: { enabled: false } })
    );
  } finally {
    params.setActivePage(params.originalPage);
    await delay(350);
  }

  if (!sections.length) {
    alert("No report data is available for the configured full report.");
    return;
  }

  const reportTitle = "Project Full Report";
  const html = buildCapturedReportHTML({
    title: reportTitle,
    projectName: params.projectName,
    sections,
    includeAutomaticHeader: false,
  });

  await saveGeneratedReportToSupabase({
    title: reportTitle,
    projectName: params.projectName,
    moduleId: "project-full-report",
    moduleName: "Budget, Procurement and Task",
    reportScope: "module",
    html,
  });

  printCapturedReportHTML(html);
}
