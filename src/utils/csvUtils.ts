export type CsvRow = Record<string, any>;

export function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function rowsToCsv(rows: CsvRow[], columns?: string[]): string {
  if (!rows.length && !columns?.length) return "";

  const headers = columns || Object.keys(rows[0] || {});

  const headerLine = headers.map(escapeCsvValue).join(",");

  const bodyLines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(",")
  );

  return [headerLine, ...bodyLines].join("\n");
}

export function downloadCsv(filename: string, csvText: string) {
  const blob = new Blob([csvText], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentValue += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }

      currentRow.push(currentValue);

      if (currentRow.some((value) => value.trim() !== "")) {
        rows.push(currentRow);
      }

      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  currentRow.push(currentValue);

  if (currentRow.some((value) => value.trim() !== "")) {
    rows.push(currentRow);
  }

  if (rows.length <= 1) return [];

  const headers = rows[0].map((header) => header.trim());

  return rows.slice(1).map((row) => {
    const record: CsvRow = {};

    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });

    return record;
  });
}

export function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}