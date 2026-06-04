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
    /overall progress|budget utilization|total request|total projected amount|total actual amount|total items|low\s*\/\s*out of stock|fully stocked|total qty\.?\s*in|total qty\.?\s*out|total remaining fuel|allotted budget|total paid|total unpaid|grand total|remaining|budget|paid|unpaid|total|projected amount|actual amount|request|count|amount/i.test(
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
      /overall progress/i.test(text) && /budget utilization/i.test(text);

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
      const overallMatch = text.match(/overall progress\s*([\d,.]+%?)/i);
      const budgetMatch = text.match(/budget utilization\s*([\d,.]+%?)/i);

      const overallProgress = overallMatch?.[1] || "0.0%";
      const budgetUtilization = budgetMatch?.[1] || "0.0%";

      container.className = "report-kpi-grid";
      container.innerHTML = `
        <div class="report-kpi-card">
          <div>Overall Progress</div>
          <div>${escapeHTML(overallProgress)}</div>
        </div>

        <div class="report-kpi-card">
          <div>Budget Utilization</div>
          <div>${escapeHTML(budgetUtilization)}</div>
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

function normalizeCharts(clone: HTMLElement): void {
  const chartElements = Array.from(
    clone.querySelectorAll(
      ".recharts-wrapper, .recharts-responsive-container, canvas, svg, [class*='chart'], [class*='Chart'], [class*='gantt'], [class*='Gantt']"
    )
  ) as HTMLElement[];

  chartElements.forEach((chart) => {
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
  normalizeCharts(clone);
  removeEmptyScheduleRows(clone, options.sectionTitle);
  removeActionAndBlankColumns(clone);
  fixCategoryRows(clone);
  removeDuplicateSectionTitlesInsideContent(clone, options.sectionTitle);
  cleanEmptyElements(clone);
  stripInlineStylesAndDarkClasses(clone);

  return clone;
}

function captureCurrentContentHTML(options: {
  keepKpis: boolean;
  sectionTitle: string;
}): string {
  const container = getActiveContentContainer();

  if (!container) {
    return `<div class="empty-section">No content available.</div>`;
  }

  const clone = container.cloneNode(true) as HTMLElement;
  const cleanedClone = cleanClonedContent(clone, options);

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
  pageTitle: string
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

  const tabLabels = getInternalTabLabels(container);

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
}): string {
  const projectName = params.projectName || "Alcantara Diesel Power Plant";
  const safeDate = formatDate(new Date());
  const orientation = detectBestOrientation(params.sections);

  const sectionsHTML = params.sections
    .map((section, index) => {
      const showTitle = shouldShowSectionTitle(section.title, params.title);

      return `
        <section class="report-section ${index === 0 ? "first-section" : ""}">
          ${
            showTitle
              ? `<h2 class="section-title">${escapeHTML(section.title)}</h2>`
              : ""
          }
          <div class="section-content">
            ${section.html}
          </div>
        </section>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHTML(params.title)}</title>
        <meta charset="UTF-8" />

        <style>
          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            font-family: Aptos, "Segoe UI", Calibri, "Helvetica Neue", Arial, sans-serif;
            color: #1F2937;
            background: #FFFFFF;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-variant-numeric: tabular-nums;
          }

          body {
            padding: 13mm 12mm;
            font-size: 10.2px;
            line-height: 1.35;
          }

          .report-document {
            width: 100%;
            max-width: 100%;
            overflow: hidden;
          }

.report-header {
  width: 100%;
  margin: 0 0 3mm;
  padding: 0 0 2.5mm;
  border-bottom: 1.1px solid #0F172A;
  page-break-inside: avoid;
  break-inside: avoid;
  page-break-after: avoid;
  break-after: avoid;
}

.report-letterhead {
  display: block;
  width: 100%;
  max-width: 100%;
  height: 21mm;
  object-fit: contain;
  object-position: center top;
  margin: 0 0 2.5mm;
}

.report-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 10mm;
  width: 100%;
}

.report-title-left {
  text-align: left;
  flex: 1;
}

.report-title-right {
  text-align: right;
  white-space: nowrap;
  flex-shrink: 0;
}

.project-name {
  font-size: 8px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: 0.65px;
  text-transform: uppercase;
  margin: 0 0 0.8mm;
  color: #475569;
}

.report-title {
  font-size: 17px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.55px;
  text-transform: uppercase;
  margin: 0;
  color: #0F172A;
}

.date-generated {
  margin: 0;
  color: #475569;
  font-size: 8px;
  line-height: 1.15;
}

          .report-section {
            margin-top: 7mm;
            page-break-inside: auto;
            break-inside: auto;
            max-width: 100%;
            overflow: hidden;
          }

          .report-section.first-section {
            margin-top: 0;
          }

          .section-title {
            font-size: 12.5px;
            line-height: 1.25;
            font-weight: 800;
            letter-spacing: 0.35px;
            margin: 0 0 4mm;
            color: #0F172A;
            text-transform: uppercase;
            border-left: 3px solid #0F172A;
            border-bottom: 1px solid #CBD5E1;
            padding: 0 0 2mm 3mm;
            page-break-after: avoid;
            break-after: avoid;
          }

          .section-content {
            width: 100%;
            max-width: 100%;
            overflow: hidden !important;
            color: #1F2937;
            font-family: Aptos, "Segoe UI", Calibri, "Helvetica Neue", Arial, sans-serif !important;
          }

          .section-content * {
            font-family: Aptos, "Segoe UI", Calibri, "Helvetica Neue", Arial, sans-serif !important;
            color: #1F2937 !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }

          .section-content > * {
            max-width: 100% !important;
          }

          .section-content button,
          .section-content input,
          .section-content select,
          .section-content textarea,
          .section-content form,
          .section-content nav {
            display: none !important;
          }

          .section-content img {
            max-width: 100%;
            height: auto;
          }

          .section-content table {
            width: 100% !important;
            max-width: 100% !important;
            border-collapse: collapse !important;
            margin: 3mm 0 5mm !important;
            font-size: ${orientation === "landscape" ? "7.2px" : "8.4px"} !important;
            line-height: 1.2 !important;
            table-layout: fixed !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
            overflow-wrap: anywhere !important;
          }

          .section-content thead {
            display: table-header-group !important;
          }

          .section-content tfoot {
            display: table-footer-group !important;
          }

          .section-content tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .section-content th {
            border: 1px solid #CBD5E1 !important;
            border-bottom: 1.4px solid #94A3B8 !important;
            background: #F8FAFC !important;
            color: #0F172A !important;
            padding: 4px 5px !important;
            text-align: left !important;
            font-weight: 800 !important;
            vertical-align: middle !important;
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1px !important;
          }

          .section-content td {
            border: 1px solid #E2E8F0 !important;
            padding: 4px 5px !important;
            text-align: left !important;
            vertical-align: top !important;
            color: #1F2937 !important;
            white-space: normal !important;
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
            font-weight: 400 !important;
          }

          .section-content table tr td[colspan],
          .section-content table tr th[colspan] {
            width: auto !important;
            max-width: 100% !important;
            background: #FFFFFF !important;
            font-weight: 700 !important;
            color: #334155 !important;
          }

          .section-content tbody tr:nth-child(even) td {
            background: #FAFAFA !important;
          }

          .report-kpi-grid {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 8px !important;
            margin: 0 0 5mm !important;
            width: 100% !important;
            max-width: 100% !important;
            align-items: stretch !important;
          }

          .report-kpi-grid-5 {
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          }

          .report-kpi-card {
            border: 1px solid #CBD5E1 !important;
            border-top: 2px solid #0F172A !important;
            background: #FFFFFF !important;
            border-radius: 4px !important;
            padding: 7px 8px !important;
            min-height: 44px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            gap: 1.5mm !important;
            font-size: 9px !important;
            line-height: 1.2 !important;
          }

          .report-kpi-card *,
          .report-kpi-card p,
          .report-kpi-card span,
          .report-kpi-card div,
          .report-kpi-card section,
          .report-kpi-card article {
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            font-size: inherit !important;
            line-height: inherit !important;
          }

          .report-kpi-card > *:first-child {
            font-size: 8px !important;
            font-weight: 700 !important;
            color: #64748B !important;
            text-transform: uppercase !important;
            letter-spacing: 0.2px !important;
          }

          .report-kpi-card > *:last-child {
            font-size: 11px !important;
            font-weight: 800 !important;
            color: #0F172A !important;
          }

          .report-summary-box {
            border: 1px solid #CBD5E1 !important;
            border-left: 3px solid #0F172A !important;
            background: #F8FAFC !important;
            border-radius: 4px !important;
            padding: 7px 9px !important;
            margin: 0 0 5mm !important;
          }

          .report-summary-title {
            font-size: 10px !important;
            line-height: 1.2 !important;
            font-weight: 800 !important;
            color: #0F172A !important;
            text-transform: uppercase !important;
            margin: 0 0 1.5mm !important;
            letter-spacing: 0.2px !important;
          }

          .report-summary-line {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 14px !important;
            font-size: 9.2px !important;
            line-height: 1.3 !important;
            color: #334155 !important;
          }

          .report-summary-line span {
            white-space: nowrap !important;
          }

          .report-summary-line strong {
            color: #0F172A !important;
            font-weight: 700 !important;
          }

          .section-content h1,
          .section-content h2,
          .section-content h3,
          .section-content h4 {
            font-size: 12px !important;
            line-height: 1.25 !important;
            font-weight: 750 !important;
            letter-spacing: 0.15px !important;
            margin: 4mm 0 1.5mm !important;
            color: #0F172A !important;
            text-transform: uppercase !important;
          }

          .section-content p {
            margin: 1mm 0 2mm !important;
            font-size: 9.5px !important;
            line-height: 1.3 !important;
            color: #334155 !important;
          }

          .section-content .report-category-row {
            border: 1px solid #E2E8F0 !important;
            background: #F8FAFC !important;
            color: #0F172A !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.15px !important;
            padding: 5px 6px !important;
            width: auto !important;
            max-width: 100% !important;
          }

          .section-content [class*="rounded"],
          .section-content [class*="shadow"],
          .section-content [class*="bg-"],
          .section-content [class*="border"] {
            box-shadow: none !important;
          }

          .section-content > div:not(.report-kpi-grid):not(.report-kpi-card) {
            border-radius: 0 !important;
          }

          .empty-section {
            text-align: center;
            padding: 18px;
            color: #64748B;
            font-style: italic;
          }

@media print {
  @page {
    size: A4 ${orientation};
    margin: 9mm;
  }

  body {
    padding: 0;
  }

.report-header {
  margin-bottom: 3mm;
  padding-bottom: 2.5mm;
}

.report-letterhead {
  width: 100%;
  max-width: 100%;
  height: 20mm;
  object-fit: contain;
  object-position: center top;
  margin: 0 0 2.5mm;
}

.report-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.report-title-left {
  text-align: left;
}

.report-title-right {
  text-align: right;
  white-space: nowrap;
}

.report-title {
  font-size: 17px;
}

          @media screen {
            body {
              max-width: ${orientation === "landscape" ? "1123px" : "794px"};
              margin: 0 auto;
              padding: 24px;
            }
          }
        </style>
      </head>

      <body>
        <div class="report-document">
<header class="report-header">
  <img
    class="report-letterhead"
    src="${REPORT_LETTERHEAD_URL}"
    alt="SUWECO Letterhead"
  />

  <div class="report-title-row">
    <div class="report-title-left">
      <p class="project-name">${escapeHTML(projectName)}</p>
      <h1 class="report-title">${escapeHTML(params.title.toUpperCase())}</h1>
    </div>

    <div class="report-title-right">
      <p class="date-generated">Date Generated: ${escapeHTML(safeDate)}</p>
    </div>
  </div>
</header>

          ${sectionsHTML}
        </div>

        <script>
          window.onload = function () {
            window.focus();
            setTimeout(function () {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

return html;
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
  const sections = await captureCurrentPageSections(params.pageTitle);

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

export async function generateFullModuleReport(
  params: GenerateFullModuleReportParams
): Promise<void> {
  const allSections: CapturedSection[] = [];

  for (const item of params.moduleItems) {
    params.setActivePage(item.id);
    await delay(900);

    const sections = await captureCurrentPageSections(item.label);

    if (sections.length > 0) {
      allSections.push(...sections);
    }
  }

  params.setActivePage(params.originalPage);
  await delay(300);

  if (!allSections.length) {
    alert("No report data available for this module.");
    return;
  }

  const reportTitle = `${params.moduleTitle} Full Report`;

  const html = buildCapturedReportHTML({
    title: reportTitle,
    projectName: params.projectName,
    sections: allSections,
  });

  await saveGeneratedReportToSupabase({
    title: reportTitle,
    projectName: params.projectName,
    moduleId: params.moduleId,
    moduleName: params.moduleTitle,
    reportScope: "module",
    html,
  });

  printCapturedReportHTML(html);
}