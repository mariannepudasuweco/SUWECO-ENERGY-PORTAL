import React, { useRef, useState } from "react";
import {
  Download,
  Upload,
  FileText,
  ChevronDown,
  Printer,
} from "lucide-react";

import {
  downloadCsv,
  parseCsv,
  rowsToCsv,
  safeFileName,
} from "../utils/csvUtils";

import {
  getCurrentPageHtmlForReport,
  openPageLikePrintableReport,
} from "../utils/reportUtils";

type GlobalActionBarProps = {
  activePage: string;
  activeModule: string;
  selectedProjectId: string | null;
  selectedProjectName?: string;
};

const WBS_COLUMNS = [
  "original_item_id",
  "item_no",
  "item",
  "department",
  "date_started",
  "due_date",
  "priority",
  "status",
  "checked",
  "remarks",
  "link",
  "requirement",
  "section",
  "subsection",
];

function getSupabase() {
  return typeof window !== "undefined" ? (window as any).supabase : null;
}

function getCurrentProjectId(selectedProjectId?: string | null) {
  return (
    selectedProjectId ||
    (typeof window !== "undefined" ? (window as any).currentProjectId : null)
  );
}

function normalizeBool(value: any) {
  const text = String(value ?? "").trim().toLowerCase();

  return (
    text === "true" ||
    text === "yes" ||
    text === "1" ||
    text === "completed"
  );
}

function isWbsPage(activePage: string) {
  return activePage === "wbs-checklist";
}

function getPageLabel(activePage: string) {
  return String(activePage || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char: string) => char.toUpperCase());
}

export default function GlobalActionBar({
  activePage,
  activeModule,
  selectedProjectId,
  selectedProjectName,
}: GlobalActionBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const projectId = getCurrentProjectId(selectedProjectId);
  const pageLabel = getPageLabel(activePage);

  const fetchWbsRows = async () => {
    const supabase = getSupabase();

    if (!projectId) {
      alert("Please select a project first.");
      return [];
    }

    if (!supabase) {
      alert("Supabase is not connected.");
      return [];
    }

    const { data, error } = await supabase
      .from("wbs_checklist_items")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[GlobalActionBar] WBS fetch error:", error);
      alert("Failed to load WBS Checklist data. Check console.");
      return [];
    }

    return data || [];
  };

  const exportCurrentPageCsv = async () => {
    setIsMenuOpen(false);
    setIsBusy(true);

    try {
      if (!isWbsPage(activePage)) {
        alert("CSV export is currently supported for WBS Checklist first.");
        return;
      }

      const rows = await fetchWbsRows();

      const csv = rowsToCsv(rows, WBS_COLUMNS);

      const filename = `${safeFileName(
        selectedProjectName || "project"
      )}-wbs-checklist.csv`;

      downloadCsv(filename, csv);
    } finally {
      setIsBusy(false);
    }
  };

  const importCurrentPageCsv = () => {
    setIsMenuOpen(false);

    if (!isWbsPage(activePage)) {
      alert("CSV import is currently supported for WBS Checklist first.");
      return;
    }

    fileInputRef.current?.click();
  };

  const handleCsvFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!isWbsPage(activePage)) {
      alert("CSV import is currently supported for WBS Checklist first.");
      return;
    }

    const supabase = getSupabase();

    if (!projectId) {
      alert("Please select a project first.");
      return;
    }

    if (!supabase) {
      alert("Supabase is not connected.");
      return;
    }

    setIsBusy(true);

    try {
      const text = await file.text();
      const parsedRows = parseCsv(text);

      if (!parsedRows.length) {
        alert("CSV file has no valid rows.");
        return;
      }

      const now = new Date().toISOString();

      const payload = parsedRows
        .filter((row: any) =>
          String(row.item || row.description || "").trim()
        )
        .map((row: any, index: number) => {
          const originalItemId =
            row.original_item_id ||
            row.id ||
            `manual-import-${Date.now()}-${index}`;

          const checked = normalizeBool(row.checked);
          const status =
            String(row.status || "").trim() ||
            (checked ? "Completed" : "Not Started");

          return {
            project_id: projectId,
            original_item_id: String(originalItemId),
            item_no: row.item_no || row.task_code || "NEW",
            task_code: row.task_code || row.item_no || "NEW",
            item: row.item || row.description || "",
            department: row.department || "",
            date_started: row.date_started || null,
            due_date: row.due_date || null,
            priority: row.priority || "Normal",
            status,
            checked,
            remarks: row.remarks || "",
            link: row.link || "",
            requirement: row.requirement || "Manual Additions",
            section: row.section || "General",
            subsection: row.subsection || "Tasks",
            is_manual: true,
            updated_at: now,
          };
        });

      if (!payload.length) {
        alert("No importable WBS rows found.");
        return;
      }

      const { error } = await supabase
        .from("wbs_checklist_items")
        .upsert(payload, {
          onConflict: "project_id,original_item_id",
        });

      if (error) {
        console.error("[GlobalActionBar] WBS import error:", error);
        alert("Import failed. Check console.");
        return;
      }

      alert(`Imported ${payload.length} WBS Checklist rows.`);
      window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  const generateThisPageReport = async () => {
  setIsMenuOpen(false);
  setIsBusy(true);

  try {
    openPageLikePrintableReport({
      projectName: selectedProjectName,
      projectId,
      pageName: pageLabel,
      moduleName: activeModule,
      mode: "this-page",
      htmlContent: getCurrentPageHtmlForReport(),
    });
  } finally {
    setIsBusy(false);
  }
};

  const generateFullModuleReport = async () => {
  setIsMenuOpen(false);
  setIsBusy(true);

  try {
    openPageLikePrintableReport({
      projectName: selectedProjectName,
      projectId,
      pageName: `${activeModule.toUpperCase()} MODULE`,
      moduleName: activeModule,
      mode: "full-module",
      htmlContent: getCurrentPageHtmlForReport(),
    });
  } finally {
    setIsBusy(false);
  }
};

  return (
    <div className="ml-auto mb-2 flex items-center flex-shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleCsvFileSelected}
      />

      <div className="relative">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => setIsMenuOpen((value) => !value)}
          className="h-10 inline-flex items-center gap-2 px-4 text-[13px] font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-60"
        >
          <FileText size={16} />
          Actions
          <ChevronDown size={15} />
        </button>

        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsMenuOpen(false)}
            />

            <div className="absolute right-0 top-full mt-2 w-[260px] bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden p-2">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Reports
              </div>

              <button
                type="button"
                onClick={generateThisPageReport}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <Printer size={15} />
                Generate Current View
              </button>

              <button
                type="button"
                onClick={generateFullModuleReport}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <Printer size={15} />
                Generate Module Report
              </button>

              <div className="my-2 border-t border-slate-100" />

              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                CSV Tools
              </div>

              <button
                type="button"
                onClick={importCurrentPageCsv}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <Upload size={15} />
                Import CSV
              </button>

              <button
                type="button"
                onClick={exportCurrentPageCsv}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <Download size={15} />
                Export CSV
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}