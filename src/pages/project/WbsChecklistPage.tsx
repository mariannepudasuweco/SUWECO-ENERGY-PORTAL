import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Pencil,
  CheckCircle2,
  FileText,
  X,
  Plus,
} from "lucide-react";
import { originalItems, ChecklistItem } from "../../data/wbsChecklistData";
import { useAccess } from "../../lib/accessControl";
import {
  buildChecklistHierarchy,
  buildChecklistNumbering,
  getChecklistStatusCounts,
  mergeChecklistSourceRows,
  type ChecklistStatusCounts,
} from "../../utils/wbsAlignment";

const initialItems = originalItems;

type DbChecklistItem = ChecklistItem & {
  original_item_id?: string;
  is_manual?: boolean;
  created_by?: string | null;
};

const PHASE_COLORS: Record<string, { bg: string; text: string }> = {
  "COMPETITIVE SELECTION PROCESS": { bg: "#eff6ff", text: "#3b82f6" },
  "PRE-DEV PHASE 1": { bg: "#faf5ff", text: "#a855f7" },
  "PRE-DEV PHASE 2": { bg: "#fdf2f8", text: "#ec4899" },
  "PRE-DEV PHASE 3": { bg: "#fffbeb", text: "#f59e0b" },
  "DEVELOPMENT PHASE": { bg: "#f0fdf4", text: "#22c55e" },
  "POST DEVELOPMENT PHASE": { bg: "#f0fdfa", text: "#14b8a6" },
  OTHERS: { bg: "#f8fafc", text: "#64748b" },
};

const PHASE_ORDER = [
  "COMPETITIVE SELECTION PROCESS",
  "PRE-DEV PHASE 1",
  "PRE-DEV PHASE 2",
  "PRE-DEV PHASE 3",
  "DEVELOPMENT PHASE",
  "POST DEVELOPMENT PHASE",
  "OTHERS",
];

const getStatusColor = (status: string) => {
  const s = (status || "").toLowerCase();

  if (s.includes("done") || s.includes("completed")) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }

  if (s.includes("ongoing") || s.includes("progress")) {
    return "bg-blue-100 text-blue-700 border-blue-200";
  }

  if (s.includes("fail") || s.includes("delay") || s.includes("not met")) {
    return "bg-red-100 text-red-700 border-red-200";
  }

  return "bg-slate-100 text-slate-600 border-slate-200";
};

export default function WbsChecklistPage() {
  const { user, hasPermission, canEditRow } = useAccess();
  const [dbItems, setDbItems] = useState<DbChecklistItem[]>([]);
  const [overrides, setOverrides] = useState<
    Record<string, Partial<ChecklistItem>>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {}
  );
  const [editingItem, setEditingItem] = useState<DbChecklistItem | null>(null);

  const [addingTaskUnder, setAddingTaskUnder] = useState<{
    displayId: string;
    phase: string;
    cat?: string;
    task?: string;
  } | null>(null);
  const [newTaskDesc, setNewTaskDesc] = useState("");

  const getSupabase = () => {
    return typeof window !== "undefined" ? (window as any).supabase : null;
  };

  const getActiveProjectId = () => {
    return typeof window !== "undefined"
      ? (window as any).currentProjectId
      : null;
  };

  const mapWbsRow = (row: any): DbChecklistItem => ({
    id: row.original_item_id || row.id,
    original_item_id: row.original_item_id || row.id,
    is_manual: row.is_manual || false,
    row: 99999,
    checked: row.checked === true,
    item_no: row.item_no || "",
    item: row.item || "",
    department: row.department || "",
    date_started: row.date_started || "",
    due_date: row.due_date || "",
    priority: row.priority || "Normal",
    date_submitted: row.date_submitted || "",
    released_date: row.released_date || "",
    status: row.status || (row.checked === true ? "Completed" : "Not Started"),
    remarks: row.remarks || "",
    link: row.link || "",
    requirement: row.requirement || "Manual Additions",
    section: row.section || "General",
    subsection: row.subsection || "Tasks",
    created_by: row.created_by || null,
  });

  const loadWbsChecklist = async () => {
    const supabase = getSupabase();
    const activeProjectId = getActiveProjectId();

    console.log("[WBS Checklist] load:", {
      activeProjectId,
      hasSupabase: !!supabase,
    });

    if (!activeProjectId) {
      console.warn("[WBS Checklist] No selected project yet.");
      return;
    }

    if (!supabase) {
      console.warn("[WBS Checklist] Supabase is not connected.");
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from("wbs_checklist_items")
      .select("*")
      .eq("project_id", activeProjectId)
      .order("created_at", { ascending: true });

    setIsLoading(false);

    if (error) {
      console.error("[WBS Checklist] Load error:", error);
      return;
    }

    setDbItems((data || []).map(mapWbsRow));
  };

  useEffect(() => {
    let attempts = 0;

    const waitForProjectAndLoad = () => {
      const projectId = getActiveProjectId();
      const supabase = getSupabase();

      if (projectId && supabase) {
        loadWbsChecklist();
        return;
      }

      attempts += 1;

      if (attempts < 20) {
        setTimeout(waitForProjectAndLoad, 300);
      } else {
        console.warn("[WBS Checklist] Project ID or Supabase was not ready.");
      }
    };

    waitForProjectAndLoad();
  }, []);

  const items = useMemo(() => {
    return mergeChecklistSourceRows<DbChecklistItem>(
      initialItems as DbChecklistItem[],
      dbItems,
      overrides as Record<string, Partial<DbChecklistItem>>
    );
  }, [dbItems, overrides]);

  const phasesList = useMemo(() => {
    const unique = [...new Set(items.map((i) => i.requirement).filter(Boolean))];

    return unique.sort((a, b) => {
      const idxA = PHASE_ORDER.indexOf(a);
      const idxB = PHASE_ORDER.indexOf(b);

      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;

      return a.localeCompare(b);
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = (
        item.item +
        " " +
        (item.requirement || "") +
        " " +
        (item.section || "") +
        " " +
        (item.subsection || "") +
        " " +
        (item.department || "")
      )
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (phaseFilter && item.requirement !== phaseFilter) return false;

      return true;
    });
  }, [items, searchQuery, phaseFilter]);

  const checklistHierarchy = useMemo(() => buildChecklistHierarchy(items), [items]);

  const checklistNumbering = useMemo(() => buildChecklistNumbering(items), [items]);

  const visibleCounts = useMemo(
    () => getChecklistStatusCounts(filteredItems),
    [filteredItems]
  );

  const getPhaseCounts = (phaseName: string): ChecklistStatusCounts =>
    checklistHierarchy.phases[phaseName]?.counts || {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      notStarted: 0,
      delayed: 0,
    };

  const getMotherPermitCounts = (
    phaseName: string,
    motherPermitName: string
  ): ChecklistStatusCounts =>
    checklistHierarchy.phases[phaseName]?.motherPermits[motherPermitName]
      ?.counts || {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      notStarted: 0,
      delayed: 0,
    };

  const getParentTaskCounts = (
    phaseName: string,
    motherPermitName: string,
    parentTaskName: string
  ): ChecklistStatusCounts =>
    checklistHierarchy.phases[phaseName]?.motherPermits[motherPermitName]
      ?.tasks[parentTaskName]?.counts || {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      notStarted: 0,
      delayed: 0,
    };

  const renderCountsBadges = (counts: ChecklistStatusCounts, label = "Total Requirements") => (
    <div className="flex flex-wrap items-center gap-1.5 normal-case tracking-normal">
      <span className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-white/80">
        {label}: {counts.total}
      </span>
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
        Completed: {counts.completed}
      </span>
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
        In Progress: {counts.inProgress}
      </span>
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-100">
        Pending: {counts.pending}
      </span>
      <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-100">
        Not Started: {counts.notStarted}
      </span>
    </div>
  );

  const groupedData = useMemo(() => {
    const root: Record<string, any> = {};

    filteredItems.forEach((item) => {
      const phase = item.requirement || "Uncategorized Phase";
      const cat = item.section || "General Category";
      const task = item.subsection || "General Task";

      if (!root[phase]) {
        root[phase] = { _items: [], categories: {} };
      }

      if (!root[phase].categories[cat]) {
        root[phase].categories[cat] = { _items: [], tasks: {} };
      }

      if (!root[phase].categories[cat].tasks[task]) {
        root[phase].categories[cat].tasks[task] = { _items: [] };
      }

      root[phase]._items.push(item);
      root[phase].categories[cat]._items.push(item);
      root[phase].categories[cat].tasks[task]._items.push(item);
    });

    const sortedPhaseKeys = Object.keys(root).sort((a, b) => {
      const idxA = PHASE_ORDER.indexOf(a);
      const idxB = PHASE_ORDER.indexOf(b);

      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;

      return a.localeCompare(b);
    });

    const sortedRoot: Record<string, any> = {};

    sortedPhaseKeys.forEach((key) => {
      sortedRoot[key] = root[key];
    });

    return sortedRoot;
  }, [filteredItems]);

  const updateItem = async (id: string, patch: Partial<ChecklistItem>) => {
    const existingForAccess = items.find((item) => String(item.id) === String(id));
    if (!canEditRow("wbs-checklist", existingForAccess || {})) {
      alert("You are not allowed to edit this WBS item.");
      return;
    }
    const supabase = getSupabase();
    const activeProjectId = getActiveProjectId();

    setOverrides((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        ...patch,
      },
    }));

    if (!activeProjectId || !supabase) {
      console.warn("[WBS Checklist] Missing project or Supabase.");
      return;
    }

    const existingItem = items.find((item) => String(item.id) === String(id));

    if (!existingItem) {
      console.warn("[WBS Checklist] Existing item not found:", id);
      return;
    }

    const nextChecked = patch.checked ?? existingItem.checked ?? false;

    const payload = {
      project_id: activeProjectId,
      original_item_id: String(id),
      item_no: existingItem.item_no || "",
      task_code: existingItem.item_no || "",
      item: patch.item ?? existingItem.item,
      department: patch.department ?? existingItem.department ?? "",
      date_started: (patch.date_started ?? existingItem.date_started) || null,
      due_date: (patch.due_date ?? existingItem.due_date) || null,
      priority: patch.priority ?? existingItem.priority ?? "Normal",
      date_submitted: existingItem.date_submitted || null,
      released_date: existingItem.released_date || null,
      status: patch.status || (nextChecked ? "Completed" : existingItem.status || "Not Started"),
      checked: nextChecked,
      remarks: patch.remarks ?? existingItem.remarks ?? "",
      link: existingItem.link || "",
      requirement: existingItem.requirement || "Manual Additions",
      section: existingItem.section || "General",
      subsection: existingItem.subsection || "Tasks",
      is_manual: Boolean(existingItem.is_manual),
      updated_at: new Date().toISOString(),
      created_by: user?.id || undefined,
    };

    const { error } = await supabase
      .from("wbs_checklist_items")
      .upsert(payload, {
        onConflict: "project_id,original_item_id",
      });

    if (error) {
      console.error(
        "[WBS Checklist] Update error full:",
        JSON.stringify(error, null, 2)
      );
      console.error("[WBS Checklist] Update error raw:", error);
      return;
    }

    await loadWbsChecklist();
    window.dispatchEvent(new CustomEvent("wbsChecklistUpdated"));
window.dispatchEvent(new CustomEvent("tasksUpdated"));
  };

  const openAddTaskModal = (
    displayId: string,
    phase: string,
    cat?: string,
    task?: string
  ) => {
    if (!hasPermission("wbs-checklist", "add")) {
      alert("You are not allowed to add WBS tasks.");
      return;
    }
    setAddingTaskUnder({ displayId, phase, cat, task });
    setNewTaskDesc("");
  };

  const performAddTask = async () => {
    if (!hasPermission("wbs-checklist", "add")) {
      alert("You are not allowed to add WBS tasks.");
      return;
    }
    if (!addingTaskUnder || !newTaskDesc.trim()) return;

    const supabase = getSupabase();
    const activeProjectId = getActiveProjectId();

    if (!activeProjectId || !supabase) {
      console.warn("[WBS Checklist] Missing project or Supabase.");
      return;
    }

    const { phase, cat, task } = addingTaskUnder;
    const manualId = `manual-${Date.now()}`;

    const newTask = {
      project_id: activeProjectId,
      original_item_id: manualId,
      item_no: "NEW",
      task_code: "NEW",
      item: newTaskDesc.trim(),
      department: "",
      date_started: null,
      due_date: null,
      priority: "Normal",
      date_submitted: null,
      released_date: null,
      status: "Not Started",
      checked: false,
      remarks: "",
      link: "",
      requirement: phase || "Manual Additions",
      section: cat || "General",
      subsection: task || "Tasks",
      is_manual: true,
      updated_at: new Date().toISOString(),
      created_by: user?.id || undefined,
    };

    const { error } = await supabase
      .from("wbs_checklist_items")
      .insert(newTask);

    if (error) {
      console.error("[WBS Checklist] Add task error:", error);
      return;
    }

    if (phase) {
      setExpandedNodes((prev) => {
        const next = { ...prev };
        next[phase] = true;
        if (cat) next[`${phase}|${cat}`] = true;
        if (task) next[`${phase}|${cat}|${task}`] = true;
        return next;
      });
    }

    setAddingTaskUnder(null);
    setNewTaskDesc("");

    await loadWbsChecklist();
    window.dispatchEvent(new CustomEvent("wbsChecklistUpdated"));
window.dispatchEvent(new CustomEvent("tasksUpdated"));
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const expandAll = () => {
    const expand: Record<string, boolean> = {};

    Object.keys(groupedData).forEach((phase) => {
      expand[phase] = true;

      Object.keys(groupedData[phase].categories).forEach((cat) => {
        expand[`${phase}|${cat}`] = true;

        Object.keys(groupedData[phase].categories[cat].tasks).forEach((task) => {
          expand[`${phase}|${cat}|${task}`] = true;
        });
      });
    });

    setExpandedNodes(expand);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-transparent">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Project WBS Checklist
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Structured project deliverables and requirements tracking
          </p>
        </div>


        <div className="flex items-center gap-3">
          {hasPermission("wbs-checklist", "add") && (
          <button
            onClick={() => openAddTaskModal("Project Scope", "")}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative w-64 border border-slate-200 rounded-md bg-white shadow-sm overflow-hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full pl-9 pr-4 py-2 bg-transparent text-sm border-none focus:outline-none focus:ring-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="py-2 px-3 text-sm bg-white border border-slate-200 rounded-md text-slate-600 focus:outline-none shadow-sm cursor-pointer"
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
          >
            <option value="">All Phases</option>
            {phasesList.map((phase) => (
              <option key={phase} value={phase}>
                {phase}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 shadow-sm"
          >
            Expand All
          </button>

          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 shadow-sm"
          >
            Collapse All
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="mb-4 text-sm text-slate-500">
          Loading WBS checklist...
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-4" data-report-preserve="true">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Phases</div>
          <div className="text-2xl font-bold text-slate-900">{checklistHierarchy.totals.phases}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Mother Permits</div>
          <div className="text-2xl font-bold text-slate-900">{checklistHierarchy.totals.motherPermits}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Parent Tasks</div>
          <div className="text-2xl font-bold text-slate-900">{checklistHierarchy.totals.parentTasks}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Total Requirements</div>
          <div className="text-2xl font-bold text-slate-900">{checklistHierarchy.totals.total}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Completed</div>
          <div className="text-2xl font-bold text-emerald-600">{checklistHierarchy.totals.completed}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Pending / In Progress</div>
          <div className="text-2xl font-bold text-blue-600">{checklistHierarchy.totals.pending + checklistHierarchy.totals.inProgress}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Visible Rows</div>
          <div className="text-2xl font-bold text-slate-900">{visibleCounts.total}</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-[#1e293b] text-white">
                <th className="px-6 py-3 font-semibold text-xs tracking-wider border-b border-slate-700 w-32">
                  ITEM NO.
                </th>
                <th className="px-4 py-3 font-semibold text-xs tracking-wider border-b border-slate-700 min-w-[300px]">
                  DESCRIPTION / SCOPE OF WORK
                </th>
                <th className="px-4 py-3 font-semibold text-xs tracking-wider border-b border-slate-700 w-40 text-center">
                  DEPARTMENT
                </th>
                <th className="px-4 py-3 font-semibold text-xs tracking-wider border-b border-slate-700 w-32 text-center">
                  TARGET START
                </th>
                <th className="px-4 py-3 font-semibold text-xs tracking-wider border-b border-slate-700 w-32 text-center">
                  TARGET END
                </th>
                <th className="px-4 py-3 font-semibold text-xs tracking-wider border-b border-slate-700 w-24 text-center">
                  PRIORITY
                </th>
                <th className="px-4 py-3 font-semibold text-xs tracking-wider border-b border-slate-700 w-32 text-center">
                  STATUS
                </th>
                <th className="px-4 py-3 font-semibold text-xs tracking-wider border-b border-slate-700 w-40 text-center">
                  REMARKS
                </th>
                <th className="px-4 py-3 font-semibold text-xs tracking-wider border-b border-slate-700 w-20 text-center">
                  LINK
                </th>
                <th className="px-6 py-3 font-semibold text-xs tracking-wider border-b border-slate-700 w-20 text-center">
                  ACTION
                </th>
              </tr>
            </thead>

            <tbody className="align-top">
              {Object.keys(groupedData).length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No items match your current filters.
                  </td>
                </tr>
              ) : (
                Object.keys(groupedData).map((phaseName, phaseIndex) => {
                  const phaseData = groupedData[phaseName];
                  const phaseColors = PHASE_COLORS[phaseName] || {
                    bg: "#f1f5f9",
                    text: "#475569",
                  };

                  const phaseCounts = getPhaseCounts(phaseName);

                  return (
                    <React.Fragment key={phaseName}>
                      <tr style={{ backgroundColor: phaseColors.bg }}>
                        <td
                          colSpan={9}
                          className="px-6 py-3 font-bold uppercase tracking-widest text-xs"
                          style={{ color: phaseColors.text }}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <span>{phaseName}</span>
                            {renderCountsBadges(phaseCounts, "Total Requirements")}
                          </div>
                        </td>

                        <td className="px-6 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddTaskModal(phaseName, phaseName);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title={`Add task to ${phaseName}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>

                      {Object.keys(phaseData.categories).map(
                        (catName, catIndex) => {
                          const catData = phaseData.categories[catName];
                          const firstCatItem = catData._items[0];
                          const catNumbering = firstCatItem
                            ? checklistNumbering.get(String(firstCatItem.original_item_id || firstCatItem.id))
                            : null;
                          const catId = catNumbering?.motherPermitCode || `P${phaseIndex + 1}-C${catIndex + 1}`;
                          const catCounts = getMotherPermitCounts(phaseName, catName);
                          const catExpanded =
                            expandedNodes[`${phaseName}|${catName}`];

                          return (
                            <React.Fragment key={catName}>
                              <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                <td
                                  className="px-6 py-4 font-mono text-slate-500 cursor-pointer select-none"
                                  onClick={() =>
                                    toggleNode(`${phaseName}|${catName}`)
                                  }
                                >
                                  <span className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                                    <span className="text-[10px]">
                                      {catExpanded ? "▼" : "▶"}
                                    </span>
                                    {catId}
                                  </span>
                                </td>

                                <td
                                  className="px-4 py-4 font-semibold text-slate-800 uppercase text-xs break-words whitespace-normal"
                                  colSpan={8}
                                >
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                    <span>{catName}</span>
                                    {renderCountsBadges(catCounts, "Requirements")}
                                  </div>
                                </td>

                                <td className="px-6 py-3 text-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openAddTaskModal(
                                        catId,
                                        phaseName,
                                        catName
                                      );
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                    title={`Add task to ${catName}`}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>

                              {catExpanded &&
                                Object.keys(catData.tasks).map(
                                  (taskName, taskIndex) => {
                                    const taskData = catData.tasks[taskName];
                                    const firstTaskItem = taskData._items[0];
                                    const taskNumbering = firstTaskItem
                                      ? checklistNumbering.get(String(firstTaskItem.original_item_id || firstTaskItem.id))
                                      : null;
                                    const taskId = taskNumbering?.parentTaskCode || `${catId}.${taskIndex + 1}`;
                                    const taskCounts = getParentTaskCounts(phaseName, catName, taskName);
                                    const taskExpanded =
                                      expandedNodes[
                                        `${phaseName}|${catName}|${taskName}`
                                      ];

                                    return (
                                      <React.Fragment key={taskName}>
                                        <tr className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                          <td
                                            className="px-6 py-3 font-mono text-slate-500 pl-10 cursor-pointer select-none"
                                            onClick={() =>
                                              toggleNode(
                                                `${phaseName}|${catName}|${taskName}`
                                              )
                                            }
                                          >
                                            <span className="flex items-center gap-2 text-xs hover:text-blue-600 transition-colors">
                                              <span className="text-[10px]">
                                                {taskExpanded ? "▼" : "▶"}
                                              </span>
                                              {taskId}
                                            </span>
                                          </td>

                                          <td
                                            className="px-4 py-3 font-semibold text-slate-600 uppercase text-[11px] break-words whitespace-normal"
                                            colSpan={8}
                                          >
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                              <span>{taskName}</span>
                                              {renderCountsBadges(taskCounts, "Requirements")}
                                            </div>
                                          </td>

                                          <td className="px-6 py-3 text-center">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openAddTaskModal(
                                                  taskId,
                                                  phaseName,
                                                  catName,
                                                  taskName
                                                );
                                              }}
                                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                              title={`Add subtask to ${taskName}`}
                                            >
                                              <Plus className="w-4 h-4" />
                                            </button>
                                          </td>
                                        </tr>

                                        {taskExpanded &&
                                          taskData._items.map(
                                            (
                                              item: DbChecklistItem,
                                              itemIndex: number
                                            ) => {
                                              const itemId =
                                                checklistNumbering.get(String(item.original_item_id || item.id))?.itemCode ||
                                                `${taskId}.${itemIndex + 1}`;

                                              return (
                                                <tr
                                                  key={item.id}
                                                  className="border-b border-slate-50 hover:bg-blue-50/50 transition-colors bg-white group"
                                                >
                                                  <td className="px-6 py-3 font-mono text-slate-400 pl-14 text-[11px]">
                                                    {itemId}
                                                  </td>

                                                  <td className="px-4 py-3 text-slate-700 text-sm whitespace-normal max-w-[400px]">
                                                    <div className="flex items-start gap-2">
                                                      <button
                                                        onClick={() =>
                                                          updateItem(item.id, {
                                                            checked:
                                                              !item.checked,
                                                            status: item.checked
                                                              ? "Not Started"
                                                              : "Completed",
                                                          })
                                                        }
                                                        className="mt-0.5 shrink-0 focus:outline-none"
                                                      >
                                                        <CheckCircle2
                                                          className={`w-4 h-4 transition-colors ${
                                                            item.checked
                                                              ? "text-emerald-500 fill-emerald-50"
                                                              : "text-slate-300 hover:text-blue-400"
                                                          }`}
                                                        />
                                                      </button>

                                                      <span
                                                        className={
                                                          item.checked
                                                            ? "line-through text-slate-400"
                                                            : ""
                                                        }
                                                      >
                                                        {item.item}
                                                      </span>
                                                    </div>
                                                  </td>

                                                  <td className="px-4 py-3 text-slate-600 text-xs text-center">
                                                    {item.department || "-"}
                                                  </td>

                                                  <td className="px-4 py-3 text-slate-600 text-xs text-center">
                                                    {item.date_started
                                                      ? new Date(
                                                          item.date_started
                                                        ).toLocaleDateString()
                                                      : "-"}
                                                  </td>

                                                  <td className="px-4 py-3 text-slate-600 text-xs text-center">
                                                    {item.due_date
                                                      ? new Date(
                                                          item.due_date
                                                        ).toLocaleDateString()
                                                      : "-"}
                                                  </td>

                                                  <td className="px-4 py-3 text-slate-600 text-xs text-center">
                                                    {item.priority || "-"}
                                                  </td>

                                                  <td className="px-4 py-3 text-center">
                                                    <span
                                                      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap uppercase tracking-wider ${getStatusColor(
                                                        item.status
                                                      )}`}
                                                    >
                                                      {item.status}
                                                    </span>
                                                  </td>

                                                  <td
                                                    className="px-4 py-3 text-slate-500 text-xs text-center truncate max-w-[150px]"
                                                    title={item.remarks}
                                                  >
                                                    {item.remarks || "-"}
                                                  </td>

                                                  <td className="px-4 py-3 text-center">
                                                    {item.link ? (
                                                      <a
                                                        href={item.link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="View Source"
                                                      >
                                                        <FileText className="w-4 h-4" />
                                                      </a>
                                                    ) : (
                                                      <span className="text-slate-300">
                                                        -
                                                      </span>
                                                    )}
                                                  </td>

                                                  <td className="px-6 py-3 text-center">
                                                    <button
                                                      onClick={() =>
                                                        setEditingItem(item)
                                                      }
                                                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                      <Pencil className="w-4 h-4" />
                                                    </button>
                                                  </td>
                                                </tr>
                                              );
                                            }
                                          )}
                                      </React.Fragment>
                                    );
                                  }
                                )}
                            </React.Fragment>
                          );
                        }
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Edit Task</h2>

              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Description / Scope of Work
                </label>
                <textarea
                  value={editingItem.item}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, item: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Department / Assignee
                  </label>
                  <input
                    type="text"
                    value={editingItem.department}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        department: e.target.value,
                      })
                    }
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Status
                  </label>
                  <select
                    value={editingItem.status}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        status: e.target.value,
                      })
                    }
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Target Start
                  </label>
                  <input
                    type="date"
                    value={editingItem.date_started || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        date_started: e.target.value,
                      })
                    }
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Target End
                  </label>
                  <input
                    type="date"
                    value={editingItem.due_date || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        due_date: e.target.value,
                      })
                    }
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Notes / Remarks
                </label>
                <input
                  type="text"
                  value={editingItem.remarks}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, remarks: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  updateItem(editingItem.id, {
                    item: editingItem.item,
                    department: editingItem.department,
                    status: editingItem.status,
                    date_started: editingItem.date_started,
                    due_date: editingItem.due_date,
                    remarks: editingItem.remarks,
                    checked: editingItem.status === "Completed",
                  });
                  setEditingItem(null);
                }}
                className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {addingTaskUnder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
              <h2 className="text-lg font-bold text-[#1e293b]">
                Add Task Under {addingTaskUnder.displayId}
              </h2>

              <button
                onClick={() => setAddingTaskUnder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                performAddTask();
              }}
            >
              <div className="p-6 pb-8">
                <label className="block text-[13px] font-semibold text-[#334155] mb-2">
                  Task Description / Scope of Work
                </label>
                <input
                  type="text"
                  value={newTaskDesc}
                  onChange={(event) => setNewTaskDesc(event.target.value)}
                  placeholder="e.g. Gather signatures"
                  className="w-full border border-blue-500 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.1)]"
                  autoFocus
                />
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                <button
                  type="button"
                  onClick={() => setAddingTaskUnder(null)}
                  className="px-5 py-2 text-[13px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 text-[13px] font-semibold text-white bg-[#2563eb] hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}