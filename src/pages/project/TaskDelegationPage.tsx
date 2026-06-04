import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Pencil,
} from "lucide-react";

declare global {
  interface Window {
    supabase?: any;
    currentProjectId?: string;
  }
}

type WbsItem = {
  id: string;
  original_item_id?: string;
  item_no?: string;
  task_code?: string;
  item?: string;
  department?: string;
  due_date?: string | null;
  priority?: string;
  status?: string;
  requirement?: string;
  section?: string;
  subsection?: string;
};

type DelegationTask = {
  id: string;
  project_id: string;
  wbs_item_id?: string;
  task_code?: string;
  task_name: string;
  assigned_to?: string;
  department?: string;
  priority?: string;
  status?: string;
  due_date?: string | null;
  remarks?: string;
};

const statusOptions = [
  "Not Yet Started",
  "Ongoing",
  "Pending",
  "Completed",
  "Delayed",
];

const priorityOptions = ["Low", "Normal", "High", "Urgent"];

function getStatusClass(status?: string) {
  const s = (status || "").toLowerCase();

  if (s.includes("completed")) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }

  if (s.includes("ongoing")) {
    return "bg-blue-100 text-blue-700 border-blue-200";
  }

  if (s.includes("delay")) {
    return "bg-red-100 text-red-700 border-red-200";
  }

  return "bg-slate-100 text-slate-600 border-slate-200";
}

export default function TaskDelegationPage() {
  const activeProjectId =
    typeof window !== "undefined" ? window.currentProjectId : null;

  const [wbsItems, setWbsItems] = useState<WbsItem[]>([]);
  const [delegations, setDelegations] = useState<DelegationTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedWbs, setSelectedWbs] = useState<WbsItem | null>(null);
  const [editingDelegation, setEditingDelegation] =
    useState<DelegationTask | null>(null);

  const [form, setForm] = useState({
    assigned_to: "",
    department: "",
    priority: "Normal",
    status: "Not Yet Started",
    due_date: "",
    remarks: "",
  });

  const loadData = async () => {
    const supabase = window.supabase;

    const projectId = window.currentProjectId;

console.log("[Delegation] loadData:", {
  projectId,
  hasSupabase: !!supabase,
});

if (!projectId || !supabase) {
  console.warn("[Delegation] Missing project or Supabase.");
  return;
}

    setIsLoading(true);

    const [wbsResult, delegationResult] = await Promise.all([
      supabase
        .from("wbs_checklist_items")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true }),

      supabase
        .from("delegation_tasks")
        .select("*")
        .eq("project_id", activeProjectId)
        .order("created_at", { ascending: false }),
    ]);

    setIsLoading(false);

    if (wbsResult.error) {
      console.error("[Delegation] WBS load error:", wbsResult.error);
    } else {
      setWbsItems(wbsResult.data || []);
    }

    if (delegationResult.error) {
      console.error("[Delegation] Delegation load error:", delegationResult.error);
    } else {
      setDelegations(delegationResult.data || []);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProjectId]);

  const filteredWbsItems = useMemo(() => {
    const q = search.toLowerCase();

    return wbsItems.filter((item) => {
      const text = [
        item.item_no,
        item.task_code,
        item.item,
        item.department,
        item.requirement,
        item.section,
        item.subsection,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [wbsItems, search]);

  const filteredDelegations = useMemo(() => {
    return delegations.filter((task) => {
      const matchSearch = [
        task.task_code,
        task.task_name,
        task.assigned_to,
        task.department,
        task.remarks,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      if (!matchSearch) return false;
      if (statusFilter && task.status !== statusFilter) return false;

      return true;
    });
  }, [delegations, search, statusFilter]);

  const stats = useMemo(() => {
    const total = delegations.length;
    const completed = delegations.filter(
      (d) => d.status === "Completed"
    ).length;
    const ongoing = delegations.filter((d) => d.status === "Ongoing").length;
    const delayed = delegations.filter((d) => d.status === "Delayed").length;

    return { total, completed, ongoing, delayed };
  }, [delegations]);

  const openAssignModal = (item: WbsItem) => {
    setSelectedWbs(item);
    setEditingDelegation(null);

    setForm({
      assigned_to: "",
      department: item.department || "",
      priority: item.priority || "Normal",
      status: "Not Yet Started",
      due_date: item.due_date || "",
      remarks: "",
    });
  };

  const openEditModal = (task: DelegationTask) => {
    setEditingDelegation(task);
    setSelectedWbs(null);

    setForm({
      assigned_to: task.assigned_to || "",
      department: task.department || "",
      priority: task.priority || "Normal",
      status: task.status || "Not Yet Started",
      due_date: task.due_date || "",
      remarks: task.remarks || "",
    });
  };

  const closeModal = () => {
    setSelectedWbs(null);
    setEditingDelegation(null);
  };

  const saveDelegation = async () => {
    const supabase = window.supabase;

    const projectId = window.currentProjectId;

console.log("[Delegation] saveDelegation:", {
  projectId,
  hasSupabase: !!supabase,
  selectedWbs,
  editingDelegation,
  form,
});

if (!projectId || !supabase) {
  alert("Missing project or Supabase connection.");
  return;
}

    if (!form.assigned_to.trim()) {
      alert("Please enter assigned person.");
      return;
    }

    let payload: any;

    if (editingDelegation) {
      payload = {
        assigned_to: form.assigned_to.trim(),
        department: form.department,
        priority: form.priority,
        status: form.status,
        due_date: form.due_date || null,
        remarks: form.remarks,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("delegation_tasks")
        .update(payload)
        .eq("id", editingDelegation.id);

      console.log("[Delegation] Update payload:", payload);
console.log("[Delegation] Update error:", error);

if (error) {
  console.error("[Delegation] Update error full:", JSON.stringify(error, null, 2));
  alert("Failed to update delegation. Check console.");
  return;
}

    } else if (selectedWbs) {
      payload = {
        project_id: projectId,
        wbs_item_id: selectedWbs.original_item_id || selectedWbs.id,
        task_code: selectedWbs.task_code || selectedWbs.item_no || "",
        task_name: selectedWbs.item || "",
        assigned_to: form.assigned_to.trim(),
        department: form.department,
        priority: form.priority,
        status: form.status,
        due_date: form.due_date || null,
        remarks: form.remarks,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("delegation_tasks")
        .insert(payload);

      console.log("[Delegation] Insert payload:", payload);
console.log("[Delegation] Insert error:", error);

if (error) {
  console.error("[Delegation] Insert error full:", JSON.stringify(error, null, 2));
  alert("Failed to save delegation. Check console.");
  return;
}
    }

    closeModal();
    await loadData();
  };

  const deleteDelegation = async (id: string) => {
    const supabase = window.supabase;

    if (!supabase) return;

    const confirmed = confirm("Delete this delegation task?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("delegation_tasks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[Delegation] Delete error:", error);
      alert("Failed to delete delegation. Check console.");
      return;
    }

    await loadData();
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-transparent">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Task Delegation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Assign WBS checklist tasks to personnel and track responsibility.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-slate-500" />
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">
                Total Assigned
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {stats.total}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">
                Completed
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {stats.completed}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">
                Ongoing
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {stats.ongoing}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">
                Delayed
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {stats.delayed}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative w-72 border border-slate-200 rounded-md bg-white shadow-sm overflow-hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search task, person, department..."
              className="w-full pl-9 pr-4 py-2 bg-transparent text-sm border-none focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="py-2 px-3 text-sm bg-white border border-slate-200 rounded-md text-slate-600 focus:outline-none shadow-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="mb-4 text-sm text-slate-500">
          Loading delegation data...
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">WBS Checklist Tasks</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select a WBS item to assign.
            </p>
          </div>

          <div className="overflow-x-auto max-h-[650px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                    Task
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                    Dept
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredWbsItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No WBS tasks found.
                    </td>
                  </tr>
                ) : (
                  filteredWbsItems.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {item.task_code || item.item_no || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-800">
                        {item.item || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {item.department || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openAssignModal(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md"
                        >
                          <Plus className="w-3 h-3" />
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Assigned Tasks</h2>
            <p className="text-xs text-slate-500 mt-1">
              Delegated tasks saved in Supabase.
            </p>
          </div>

          <div className="overflow-x-auto max-h-[650px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                    Task
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredDelegations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No delegated tasks yet.
                    </td>
                  </tr>
                ) : (
                  filteredDelegations.map((task) => (
                    <tr key={task.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">
                          {task.task_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {task.task_code || "-"} · Due: {task.due_date || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-medium">
                          {task.assigned_to || "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {task.department || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusClass(
                            task.status
                          )}`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteDelegation(task.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(selectedWbs || editingDelegation) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingDelegation ? "Edit Delegation" : "Assign Task"}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Task
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                  {editingDelegation?.task_name || selectedWbs?.item}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Assigned To
                </label>
                <input
                  type="text"
                  value={form.assigned_to}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, assigned_to: e.target.value }))
                  }
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-600"
                  placeholder="Enter personnel name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, department: e.target.value }))
                  }
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-600"
                  placeholder="Enter department"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, priority: e.target.value }))
                    }
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white"
                  >
                    {priorityOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, status: e.target.value }))
                    }
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, due_date: e.target.value }))
                  }
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Remarks
                </label>
                <textarea
                  value={form.remarks}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, remarks: e.target.value }))
                  }
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveDelegation}
                className="px-6 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}