import { CsvRow } from "./csvUtils";

function escapeHtml(value: any): string {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getCurrentPageHtmlForReport() {
  const source =
    document.getElementById("reactContainer") ||
    document.getElementById("contentArea");

  if (!source) {
    return `<p>No report content found.</p>`;
  }

  const clone = source.cloneNode(true) as HTMLElement;

  // Remove duplicated page title/description from cloned page content
const firstHeading = clone.querySelector("h1");
if (firstHeading) {
  const parentBlock = firstHeading.parentElement;
  parentBlock?.remove();
}

// Remove empty trailing columns from every table, including blank action columns
clone.querySelectorAll("table").forEach((table) => {
  let keepChecking = true;

  while (keepChecking) {
    keepChecking = false;

    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows.length === 0) return;

    const maxColumns = Math.max(...rows.map((row) => row.children.length));
    if (maxColumns <= 0) return;

    const lastIndex = maxColumns - 1;

    const lastColumnIsEmpty = rows.every((row) => {
      const cell = row.children[lastIndex] as HTMLElement | undefined;

      if (!cell) return true;

      const text = cell.textContent?.trim() || "";
      const hasVisibleElement = !!cell.querySelector(
        "button, input, select, textarea, svg, img, a"
      );

      return text === "" && !hasVisibleElement;
    });

    if (lastColumnIsEmpty) {
      rows.forEach((row) => {
        const cell = row.children[lastIndex];
        if (cell) cell.remove();
      });

      keepChecking = true;
    }
  }
});

// Remove remaining empty cells that appear after action buttons are stripped
clone.querySelectorAll("th, td").forEach((cell) => {
  const element = cell as HTMLElement;
  const text = element.textContent?.trim() || "";
  const hasVisibleElement = !!element.querySelector(
    "button, input, select, textarea, svg, img, a"
  );

  if (text === "" && !hasVisibleElement) {
    element.remove();
  }
});

  // Remove common interactive controls
  clone.querySelectorAll("button, input, select, textarea").forEach((el) => {
    el.remove();
  });

  // Remove action columns from every table
clone.querySelectorAll("table").forEach((table) => {
  const headerRows = Array.from(table.querySelectorAll("thead tr"));
  const allRows = Array.from(table.querySelectorAll("tr"));
  const actionIndexes: number[] = [];

  headerRows.forEach((headerRow) => {
    const headers = Array.from(headerRow.children);

    headers.forEach((cell, index) => {
      const text = cell.textContent?.trim().toLowerCase() || "";

      if (
        text === "action" ||
        text === "actions" ||
        text.includes("action")
      ) {
        actionIndexes.push(index);
      }
    });
  });

  const uniqueIndexes = Array.from(new Set(actionIndexes)).sort((a, b) => b - a);

  if (uniqueIndexes.length > 0) {
    allRows.forEach((row) => {
      const cells = Array.from(row.children);

      uniqueIndexes.forEach((index) => {
        cells[index]?.remove();
      });
    });
  }
});

// Remove remaining icon-only cells usually used for edit/delete actions
clone.querySelectorAll("td").forEach((td) => {
  const text = td.textContent?.trim() || "";
  const hasOnlyIcon =
    text === "" &&
    (td.querySelector("svg") || td.querySelector("button") || td.querySelector("a"));

  if (hasOnlyIcon) {
    td.remove();
  }
});

  // Remove empty utility bars after controls are removed
  clone.querySelectorAll("div").forEach((div) => {
    const text = div.textContent?.trim() || "";
    const hasTable = !!div.querySelector("table");
    const hasCards = div.children.length > 0;

    if (!text && !hasTable && !hasCards) {
      div.remove();
    }
  });

  return clone.innerHTML;
}

export function openPageLikePrintableReport(options: {
  projectName?: string;
  projectId?: string | number | null;
  pageName: string;
  moduleName?: string | null;
  mode: "this-page" | "full-module";
  htmlContent?: string;
}) {
  const generatedAt = new Date().toLocaleDateString(undefined, {
  year: "numeric",
  month: "long",
  day: "numeric",
});
  const htmlContent = options.htmlContent || getCurrentPageHtmlForReport();

  const reportWindow = window.open("", "_blank", "width=1400,height=900");

  if (!reportWindow) {
    alert("Popup blocked. Please allow popups to generate report.");
    return;
  }

  reportWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Generated Report</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 32px;
            font-family: Arial, sans-serif;
            background: #ffffff;
            color: #0f172a;
          }

          .print-actions {
            margin-bottom: 24px;
          }

          .print-actions button {
            padding: 10px 18px;
            border: 0;
            background: #2563eb;
            color: white;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
          }

          .report-header {
  border-bottom: 4px solid #1e293b;
  padding-bottom: 18px;
  margin-bottom: 24px;
}

.report-title {
  font-size: 28px;
  font-weight: 900;
  margin: 0;
  color: #0f172a;
}

.report-subtitle {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.report-meta-simple {
  margin-top: 10px;
  font-size: 12px;
  color: #475569;
}

          .report-meta strong {
            color: #0f172a;
          }

          .report-content {
            width: 100%;
          }

          /* Keep page cards/KPIs but make them print-friendly */
          .report-content .grid {
            display: grid !important;
          }

          .report-content [class*="shadow"] {
            box-shadow: none !important;
          }

          .report-content [class*="rounded"] {
            border-radius: 10px !important;
          }

          .report-content [class*="border"] {
            border-color: #dbe3ea !important;
          }

          .report-content [class*="bg-white"] {
            background: #ffffff !important;
          }

          .report-content [class*="text-white"] {
            color: #ffffff !important;
          }

          .report-content table {
  width: 100% !important;
  table-layout: fixed !important;
  border-collapse: collapse !important;
}

.report-content th,
.report-content td {
  border: 1px solid #cbd5e1 !important;
  box-sizing: border-box !important;
}

.report-content th:last-child,
.report-content td:last-child {
  border-right: 1px solid #cbd5e1 !important;
}

.report-content table colgroup col:last-child {
  display: none !important;
}

          .report-content tr:nth-child(even) td {
            background: #f8fafc !important;
          }

          .report-content .overflow-x-auto,
          .report-content .overflow-y-auto {
            overflow: visible !important;
          }

          .report-content [class*="max-h"],
          .report-content [class*="h-full"] {
            max-height: none !important;
            height: auto !important;
          }

          .report-content [class*="absolute"],
          .report-content [class*="fixed"] {
            position: static !important;
          }

          .report-content [class*="p-6"] {
            padding: 0 !important;
          }

          .report-content [class*="p-8"] {
            padding: 0 !important;
          }

          .report-content [class*="mb-6"] {
            margin-bottom: 16px !important;
          }

          .report-content a {
            color: #2563eb;
            text-decoration: none;
          }

          @media print {
            body {
              padding: 16px;
            }

            .print-actions {
              display: none;
            }

            .report-header {
              margin-bottom: 18px;
            }

            .report-title {
              font-size: 24px;
            }

            table {
              page-break-inside: auto;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        </style>
      </head>

      <body>
        <div class="print-actions">
          <button onclick="window.print()">Print / Save as PDF</button>
        </div>

        <div class="report-header">
  <h1 class="report-title">${escapeHtml(options.projectName || "Project Report")}</h1>
  <div class="report-subtitle">${escapeHtml(options.pageName).toUpperCase()}</div>

  <div class="report-meta-simple">
    <strong>Date Generated:</strong> ${escapeHtml(generatedAt)}
  </div>
</div>

        <main class="report-content">
          ${htmlContent}
        </main>
      </body>
    </html>
  `);

  reportWindow.document.close();
}