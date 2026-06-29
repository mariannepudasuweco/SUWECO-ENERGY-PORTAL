import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter
} from "lucide-react";
import { PERSONNEL_LIST } from "../../data/personnelData";

declare global {
  interface Window {
    supabase?: any;
    currentProjectId?: string;
  }
}

type WbsItem = {
  id: string;
  item_no?: string;
  task_code?: string;
  item?: string;
  task_name?: string;
  department?: string;
  assigned_to?: string;
  personnel?: string;
  due_date?: string | null;
  status?: string;
  checked?: boolean;
};



export default function TaskDelegationPage() {
  const activeProjectId =
    typeof window !== "undefined" ? window.currentProjectId : null;

  const [wbsItems, setWbsItems] = useState<WbsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const supabase = window.supabase;
      const projectId = window.currentProjectId;

      if (!projectId || !supabase) {
        return;
      }

      setIsLoading(true);

      const { data, error } = await supabase
        .from("wbs_checklist_items")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[Delegation] WBS load error:", error);
      } else {
        setWbsItems(data || []);
      }
      setIsLoading(false);
    };

    loadData();
  }, [activeProjectId]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Total active tasks across all personnel to compute workload percentage
  const totalActiveTasksAcrossAll = useMemo(() => {
    return wbsItems.filter((task) => {
      const status = (task.status || "").toLowerCase();
      return status.includes("in progress") || status.includes("ongoing");
    }).length;
  }, [wbsItems]);

  const getPersonnelData = (personnelName: string) => {
    const personTasks = wbsItems.filter((task) => {
      const assigned = (task.assigned_to || task.personnel || "").toUpperCase();
      return assigned.includes(personnelName.toUpperCase());
    });

    let done = 0;
    let active = 0;
    let overdue = 0;
    const assignedList: WbsItem[] = [];

    personTasks.forEach((task) => {
      const status = (task.status || "").toLowerCase();
      const isCompleted = status.includes("completed") || task.checked === true;
      const isActive = status.includes("in progress") || status.includes("ongoing");

      let isOverdue = false;
      if (task.due_date && !isCompleted) {
        const dueDate = new Date(task.due_date);
        if (dueDate < today) {
          isOverdue = true;
        }
      }

      if (isCompleted) done++;
      if (isActive) active++;
      if (isOverdue) overdue++;

      assignedList.push(task);
    });

    const workloadPercentage =
      totalActiveTasksAcrossAll > 0
        ? Math.round((active / totalActiveTasksAcrossAll) * 100)
        : 0;

    return { done, active, overdue, workloadPercentage, assignedList };
  };

  const filteredPersonnel = useMemo(() => {
    if (!search.trim()) return PERSONNEL_LIST;
    const lowerSearch = search.toLowerCase();
    return PERSONNEL_LIST.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerSearch) ||
        p.title.toLowerCase().includes(lowerSearch)
    );
  }, [search]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-transparent">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 mb-4 shadow-sm">
        <div className="flex items-center gap-3 text-xl font-bold text-slate-900 tracking-tight">
          <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-teal-700" />
          </div>
          Task Delegation & Personnel
        </div>
        <button className="bg-teal-700 hover:bg-teal-800 text-white border-none py-2 px-4 rounded-lg font-semibold text-sm flex items-center gap-2 cursor-pointer transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Add Personnel
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 items-center border border-slate-200 py-2.5 px-4 rounded-xl bg-white mb-4 shadow-sm">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search personnel or tasks..."
          className="bg-transparent flex-1 outline-none text-sm text-slate-700"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="w-[1px] h-6 bg-slate-200"></div>
        <Filter className="w-4 h-4 text-slate-400" />
        <select className="bg-transparent border-none outline-none text-slate-700 text-sm cursor-pointer min-w-[80px]">
          <option>All</option>
        </select>
      </div>

      {/* Global Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 font-semibold text-sm text-slate-500">
            <Filter className="w-4 h-4" />
            Global Filters
          </div>
          <button className="bg-transparent border-none text-slate-500 text-xs font-medium cursor-pointer hover:underline p-0">
            Reset All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Phase</label>
            <select className="p-2.5 border border-slate-200 rounded-md bg-slate-50 text-slate-700 text-sm outline-none focus:border-teal-500 focus:bg-white transition-colors">
              <option>All</option>
              <option>Competitive Selection Process</option>
              <option>Pre-Development</option>
              <option>Development Phase</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Department</label>
            <select className="p-2.5 border border-slate-200 rounded-md bg-slate-50 text-slate-700 text-sm outline-none focus:border-teal-500 focus:bg-white transition-colors">
              <option>All</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Personnel</label>
            <select className="p-2.5 border border-slate-200 rounded-md bg-slate-50 text-slate-700 text-sm outline-none focus:border-teal-500 focus:bg-white transition-colors">
              <option>All</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Status</label>
            <select className="p-2.5 border border-slate-200 rounded-md bg-slate-50 text-slate-700 text-sm outline-none focus:border-teal-500 focus:bg-white transition-colors">
              <option>All</option>
              <option>Not Yet Started</option>
              <option>Ongoing</option>
              <option>Completed</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-sm text-slate-500 mb-4 animate-pulse font-medium px-1">
          Loading delegation data...
        </div>
      )}

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-8">
        {filteredPersonnel.map((p, idx) => {
          const { done, active, overdue, workloadPercentage, assignedList } =
            getPersonnelData(p.name);

          return (
            <div
              key={p.name}
              className="border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-teal-800 ${
                      idx % 2 === 0 ? "bg-teal-50" : "bg-emerald-100"
                    }`}
                  >
                    {p.initials}
                  </div>
                  <div>
                    <div className="font-bold text-[1.05rem] text-slate-900 leading-tight">
                      {p.name}
                    </div>
                    <div className="text-[0.7rem] text-slate-500 font-bold tracking-widest uppercase mt-1">
                      {p.title}
                    </div>
                  </div>
                </div>
                <div className="text-right pt-1">
                  <div className="text-[0.65rem] text-slate-400 font-bold tracking-widest mb-1.5">
                    WORKLOAD
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-[50px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all duration-500"
                        style={{ width: `${workloadPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-black text-slate-800 w-8 text-right">
                      {workloadPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Counters */}
              <div className="flex gap-4 text-xs font-semibold mt-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span className="text-slate-700">{done} Done</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-slate-700">{active} Active</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span className="text-slate-700">{overdue} Overdue</span>
                </div>
              </div>

              {/* Assigned Tasks */}
              <div className="border-t border-slate-100 pt-4 mt-2 flex-1">
                <div className="text-[0.65rem] text-slate-400 font-bold tracking-widest mb-3">
                  ASSIGNED TASKS
                </div>
                {assignedList.length > 0 ? (
                  <ul className="space-y-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                    {assignedList.map((task, i) => (
                      <li
                        key={task.id || i}
                        className="text-xs flex flex-col gap-1 pb-2 border-b border-slate-50 last:border-0 last:pb-0"
                      >
                        <span className="font-semibold text-slate-700 line-clamp-2 leading-relaxed">
                          {task.item || task.task_name || task.task_code || "Untitled Task"}
                        </span>
                        {(task.due_date || task.status) && (
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium mt-0.5">
                            {task.status && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 uppercase tracking-wider text-[9px]">
                                {task.status}
                              </span>
                            )}
                            {task.due_date && <span>Due: {task.due_date}</span>}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-400 italic py-2">
                    No tasks assigned to this personnel.
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-semibold text-xs transition-colors mt-2">
                View Full Profile & History
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}