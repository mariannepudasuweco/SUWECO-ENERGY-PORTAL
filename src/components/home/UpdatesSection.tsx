import React, { useEffect, useMemo, useState } from "react";
import { FileText, Download, Bell } from "lucide-react";
import { motion } from "framer-motion";

type ProjectRow = {
  id: string;
  name?: string;
  title?: string;
  project_name?: string;
  status?: string;
  description?: string;
  updated_at?: string;
  created_at?: string;
};

type WbsTaskRow = {
  id: string;
  project_id?: string;
  item?: string;
  task_name?: string;
  description?: string;
  status?: string;
  checked?: boolean;
  due_date?: string;
  date_started?: string;
  priority?: string;
  department?: string;
  updated_at?: string;
  created_at?: string;
};

type NewsItem = {
  image: string;
  tag: string;
  date: string;
  title: string;
  desc: string;
  progress: number;
  projectId?: string;
};

type AnnouncementItem = {
  title: string;
  date: string;
  tag?: string;
};

type PublicReportItem = {
  id: string;
  title: string;
  date: string;
  fileUrl?: string | null;
  html?: string | null;
};

const FALLBACK_NEWS: NewsItem[] = [
  {
    image:
      "https://media.base44.com/images/public/69e9e140d7e96b7a239b4002/b5f6b55f7_generated_5ca400c8.png",
    tag: "Community",
    date: "May 10, 2025",
    title: "Community Partnership Meeting",
    desc: "Strengthening collaboration with local leaders and communities for a brighter, more resilient future across all barangays.",
    progress: 0,
  },
  {
    image:
      "https://media.base44.com/images/public/69e9e140d7e96b7a239b4002/f3c24a5fb_generated_a05d7eb0.png",
    tag: "Operations",
    date: "April 28, 2025",
    title: "Preventive Maintenance Activities",
    desc: "Routine check-ups and maintenance activities to ensure safe, efficient, and reliable power operations year-round.",
    progress: 0,
  },
  {
    image:
      "https://media.base44.com/images/public/69e9e140d7e96b7a239b4002/07781ea01_generated_b5987047.png",
    tag: "Outreach",
    date: "April 15, 2025",
    title: "Energy Awareness Campaign",
    desc: "Promoting energy conservation and responsible usage in local schools and barangays across Tablas Island.",
    progress: 0,
  },
];

const FALLBACK_ANNOUNCEMENTS: AnnouncementItem[] = [
  { title: "Scheduled Power Service Advisory – May 2025", date: "May 4, 2025" },
  { title: "Holiday Operations Notice – May 2025", date: "May 1, 2025" },
  { title: "Billing System Maintenance Advisory", date: "April 30, 2025" },
  { title: "New Rate Schedule Effective June 2025", date: "April 22, 2025" },
];

const FALLBACK_DOCUMENTS = [
  "2024 Annual Report",
  "Financial Statements 2024",
  "Environmental Compliance Report",
  "Grid Performance Summary Q1 2025",
  "Power Rates & Tariff Schedule",
  "Corporate Governance Manual",
];

const PROJECT_IMAGES = [
  "https://media.base44.com/images/public/69e9e140d7e96b7a239b4002/b5f6b55f7_generated_5ca400c8.png",
  "https://media.base44.com/images/public/69e9e140d7e96b7a239b4002/f3c24a5fb_generated_a05d7eb0.png",
  "https://media.base44.com/images/public/69e9e140d7e96b7a239b4002/07781ea01_generated_b5987047.png",
];

const getSupabase = () => {
  return typeof window !== "undefined" ? (window as any).supabase : null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Recently Updated";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recently Updated";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const normalizeStatus = (status?: string, checked?: boolean) => {
  const raw = String(status || "").toLowerCase();

  if (checked === true || raw.includes("completed") || raw.includes("done")) {
    return "completed";
  }

  if (raw.includes("ongoing") || raw.includes("progress")) {
    return "ongoing";
  }

  if (raw.includes("delay") || raw.includes("overdue")) {
    return "overdue";
  }

  if (raw.includes("not applicable") || raw.includes("n/a")) {
    return "not_applicable";
  }

  return "not_started";
};

const isUpcoming = (dateValue?: string | null) => {
  if (!dateValue) return false;

  const today = new Date();
  const due = new Date(dateValue);

  if (Number.isNaN(due.getTime())) return false;

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return diffDays >= 0 && diffDays <= 14;
};

const isOverdue = (
  dateValue?: string | null,
  status?: string,
  checked?: boolean
) => {
  if (!dateValue) return false;

  const normalized = normalizeStatus(status, checked);

  if (normalized === "completed" || normalized === "not_applicable") {
    return false;
  }

  const today = new Date();
  const due = new Date(dateValue);

  if (Number.isNaN(due.getTime())) return false;

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return due.getTime() < today.getTime();
};

const getProjectName = (project: ProjectRow) => {
  return (
    project.name ||
    project.title ||
    project.project_name ||
    "Selected Project"
  );
};

export default function UpdatesSection() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [tasks, setTasks] = useState<WbsTaskRow[]>([]);
  const [publicReports, setPublicReports] = useState<PublicReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPublicUpdates = async () => {
      const supabase = getSupabase();

      if (!supabase) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });

      if (projectError) {
        console.error(
          "[Homepage Updates] Failed to load projects:",
          projectError
        );
        setProjects([]);
        setTasks([]);
      } else {
        const loadedProjects = projectData || [];
        setProjects(loadedProjects);

        const projectIds = loadedProjects
          .map((project: ProjectRow) => project.id)
          .filter(Boolean);

        if (projectIds.length > 0) {
          const { data: taskData, error: taskError } = await supabase
            .from("wbs_checklist_items")
            .select("*")
            .in("project_id", projectIds);

          if (taskError) {
            console.error(
              "[Homepage Updates] Failed to load WBS tasks:",
              taskError
            );
            setTasks([]);
          } else {
            setTasks(taskData || []);
          }
        } else {
          setTasks([]);
        }
      }

const { data: reportData, error: reportError } = await supabase
  .from("generated_reports")
  .select(
    "id, report_title, report_date, generated_at, file_url, report_html, is_public"
  )
  .eq("is_public", true)
  .order("generated_at", { ascending: false })
  .limit(6);

if (reportError) {
  console.error(
    "[Homepage Updates] Failed to load public reports:",
    reportError
  );
  setPublicReports([]);
} else {
  setPublicReports(
    (reportData || [])
      .filter((report: any) => report.is_public === true)
      .map((report: any) => ({
        id: report.id,
        title: report.report_title || "Generated Report",
        date: formatDate(report.report_date || report.generated_at),
        fileUrl: report.file_url || null,
        html: report.report_html || null,
      }))
  );
}

      setIsLoading(false);
    };

    loadPublicUpdates();

    const handleRefresh = () => {
      loadPublicUpdates();
    };

    window.addEventListener("wbsChecklistUpdated", handleRefresh);
    window.addEventListener("tasksUpdated", handleRefresh);
    window.addEventListener("generatedReportsUpdated", handleRefresh);

    return () => {
      window.removeEventListener("wbsChecklistUpdated", handleRefresh);
      window.removeEventListener("tasksUpdated", handleRefresh);
      window.removeEventListener("generatedReportsUpdated", handleRefresh);
    };
  }, []);

  const dynamicNews = useMemo<NewsItem[]>(() => {
    if (!projects.length) return FALLBACK_NEWS;

    const newsItems = projects.slice(0, 3).map((project, index) => {
      const projectTasks = tasks.filter(
        (task) => String(task.project_id) === String(project.id)
      );

      const countableTasks = projectTasks.filter(
        (task) => normalizeStatus(task.status, task.checked) !== "not_applicable"
      );

      const completedTasks = countableTasks.filter(
        (task) => normalizeStatus(task.status, task.checked) === "completed"
      );

      const ongoingTasks = countableTasks.filter(
        (task) => normalizeStatus(task.status, task.checked) === "ongoing"
      );

      const overdueTasks = countableTasks.filter((task) =>
        isOverdue(task.due_date, task.status, task.checked)
      );

      const total = countableTasks.length;
      const completed = completedTasks.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      const projectName = getProjectName(project);

      let tag = "Project Update";

      if (overdueTasks.length > 0) {
        tag = "Needs Attention";
      } else if (progress >= 100 && total > 0) {
        tag = "Completed";
      } else if (ongoingTasks.length > 0) {
        tag = "In Progress";
      }

      return {
        image: PROJECT_IMAGES[index % PROJECT_IMAGES.length],
        tag,
        date: formatDate(project.updated_at || project.created_at),
        title: `${projectName} Progress Update`,
        desc:
          total > 0
            ? `${progress}% completed based on ${completed} of ${total} completed project tasks. ${ongoingTasks.length} task(s) are currently ongoing and ${overdueTasks.length} task(s) need attention.`
            : "Project progress tracking is being prepared. Updates will appear once project tasks are encoded.",
        progress,
        projectId: project.id,
      };
    });

    return newsItems.length > 0 ? newsItems : FALLBACK_NEWS;
  }, [projects, tasks]);

  const dynamicAnnouncements = useMemo<AnnouncementItem[]>(() => {
    if (!projects.length) return FALLBACK_ANNOUNCEMENTS;

    const projectMap = new Map(
      projects.map((project) => [String(project.id), getProjectName(project)])
    );

    const overdueItems = tasks
      .filter((task) => isOverdue(task.due_date, task.status, task.checked))
      .map((task) => ({
        title: `${task.item || task.task_name || "Project task"} is overdue`,
        date: formatDate(task.due_date || task.updated_at || task.created_at),
        tag: projectMap.get(String(task.project_id)) || "Project",
      }));

    const upcomingItems = tasks
      .filter((task) => {
        const status = normalizeStatus(task.status, task.checked);
        return status !== "completed" && isUpcoming(task.due_date);
      })
      .map((task) => ({
        title: `${task.item || task.task_name || "Project task"} is due soon`,
        date: formatDate(task.due_date || task.updated_at || task.created_at),
        tag: projectMap.get(String(task.project_id)) || "Project",
      }));

    const latestTaskItems = tasks
      .slice()
      .sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || "").getTime();
        const dateB = new Date(b.updated_at || b.created_at || "").getTime();

        return (
          (Number.isNaN(dateB) ? 0 : dateB) -
          (Number.isNaN(dateA) ? 0 : dateA)
        );
      })
      .map((task) => {
        const status = normalizeStatus(task.status, task.checked);

        let statusLabel = "updated";

        if (status === "completed") statusLabel = "completed";
        if (status === "ongoing") statusLabel = "in progress";
        if (status === "overdue") statusLabel = "needs attention";

        return {
          title: `${task.item || task.task_name || "Project task"} is ${statusLabel}`,
          date: formatDate(task.updated_at || task.created_at || task.due_date),
          tag: projectMap.get(String(task.project_id)) || "Project",
        };
      });

    const projectProgressItems = projects.map((project) => {
      const projectTasks = tasks.filter(
        (task) => String(task.project_id) === String(project.id)
      );

      const countableTasks = projectTasks.filter(
        (task) => normalizeStatus(task.status, task.checked) !== "not_applicable"
      );

      const completedTasks = countableTasks.filter(
        (task) => normalizeStatus(task.status, task.checked) === "completed"
      );

      const total = countableTasks.length;
      const completed = completedTasks.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        title:
          total > 0
            ? `${getProjectName(project)} is ${progress}% complete`
            : `${getProjectName(project)} progress tracking is being prepared`,
        date: formatDate(project.updated_at || project.created_at),
        tag: "Project Progress",
      };
    });

    const combined = [
      ...overdueItems,
      ...upcomingItems,
      ...latestTaskItems,
      ...projectProgressItems,
    ];

    const uniqueItems = combined.filter((item, index, array) => {
      return array.findIndex((entry) => entry.title === item.title) === index;
    });

    return uniqueItems.length > 0
      ? uniqueItems.slice(0, 4)
      : FALLBACK_ANNOUNCEMENTS;
  }, [tasks, projects]);

  const displayedReports = useMemo<PublicReportItem[]>(() => {
    if (publicReports.length > 0) {
      return publicReports;
    }

    return FALLBACK_DOCUMENTS.map((doc, index) => ({
      id: `fallback-${index}`,
      title: doc,
      date: "",
      fileUrl: null,
      html: null,
    }));
  }, [publicReports]);

  const openReport = (report: PublicReportItem) => {
    if (report.fileUrl) {
      window.open(report.fileUrl, "_blank");
      return;
    }

    if (report.html) {
      const previewWindow = window.open("", "_blank", "width=1200,height=800");

      if (!previewWindow) {
        alert("Please allow pop-ups to view the report.");
        return;
      }

      previewWindow.document.open();
      previewWindow.document.write(report.html);
      previewWindow.document.close();
      return;
    }

    alert("This public report is not available for viewing yet.");
  };

  return (
    <section
      id="updates"
      className="news-section relative bg-[#f8f9fb] py-24 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          className="text-center mb-12 flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="w-12 h-[2px] bg-[#f5a623]" />
            <span className="text-[#1b2d48] font-bold text-sm tracking-[0.2em] uppercase">
              Latest
            </span>
            <div className="w-12 h-[2px] bg-[#f5a623]" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1b2d48] leading-[1.1] tracking-tight">
            News & Updates
          </h2>

          {isLoading && (
            <p className="mt-4 text-sm text-[#64748b] font-medium">
              Loading latest project updates...
            </p>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {dynamicNews.map((item, i) => (
            <motion.div
              key={`${item.title}-${i}`}
              className="group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-[#f5a623]/30 hover:shadow-2xl transition-all duration-500"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <span className="absolute top-5 left-5 bg-[#f5a623] text-white text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase shadow-lg">
                  {item.tag}
                </span>
              </div>

              <div className="flex-1 p-6 lg:p-8 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-[1px] bg-[#f5a623]/30" />
                  <p className="text-[#9ca3af] text-[11px] font-bold uppercase tracking-widest">
                    {item.date}
                  </p>
                </div>

                <h3 className="text-xl font-bold text-[#1b2d48] mb-3 leading-tight group-hover:text-[#f5a623] transition-colors duration-300">
                  {item.title}
                </h3>

                <p className="text-[#64748b] text-sm leading-relaxed mb-5 flex-1">
                  {item.desc}
                </p>

                {item.progress > 0 && (
                  <div className="mb-1">
                    <div className="flex items-center justify-between text-xs font-bold text-[#1b2d48] mb-2">
                      <span>Project Progress</span>
                      <span>{item.progress}%</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#f5a623]"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <motion.div
            className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 p-8 lg:p-10 shadow-sm"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-orange-50 rounded-xl">
                <Bell className="w-5 h-5 text-[#f5a623]" />
              </div>

              <h3 className="text-2xl font-bold text-[#1b2d48]">
                Project Announcements
              </h3>
            </div>

            <div className="grid gap-2">
              {dynamicAnnouncements.map((item) => (
                <div
                  key={`${item.title}-${item.date}`}
                  className="flex items-center justify-between p-4 rounded-2xl border border-transparent"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#f5a623] opacity-60" />

                    <div>
                      <p className="text-base font-semibold text-[#334155]">
                        {item.title}
                      </p>

                      <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mt-0.5">
                        {item.tag ? `${item.tag} • ` : ""}
                        {item.date}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-5 bg-[#1b2d48] rounded-3xl p-8 lg:p-10 text-white shadow-2xl relative overflow-hidden"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <FileText className="w-5 h-5 text-white" />
                </div>

                <h3 className="text-2xl font-bold">Public Reports</h3>
              </div>

              <div className="space-y-2">
                {displayedReports.map((report) => {
                  const isAvailable = Boolean(report.fileUrl || report.html);

                  return (
                    <div
                      key={report.id}
                      onClick={() => {
                        if (isAvailable) openReport(report);
                      }}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group border border-transparent ${
                        isAvailable
                          ? "cursor-pointer hover:bg-white/5 hover:border-white/10"
                          : "cursor-default opacity-75"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#f5a623]/20 transition-colors">
                        <Download className="w-4 h-4 text-white/50 group-hover:text-[#f5a623]" />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-medium text-white/80 group-hover:text-white">
                          {report.title}
                        </p>

                        {report.date && (
                          <p className="text-[10px] uppercase font-bold tracking-widest text-white/35 mt-1">
                            {report.date}
                          </p>
                        )}
                      </div>

                      <div className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                        PDF
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}