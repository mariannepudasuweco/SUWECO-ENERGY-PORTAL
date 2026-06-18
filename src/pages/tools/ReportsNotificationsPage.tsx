import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  FileText,
  RefreshCw,
  Calendar,
  Search,
  Trash2,
  Eye,
  Printer,
  Download,
  CheckCircle,
  AlertCircle,
  Mail,
  X,
  Plus,
  Globe2,
  Lock,
} from "lucide-react";
import { PageContainer } from "../../components/layout/PageContainer";
import { useAccess } from "../../lib/accessControl";

type ReportScope = "page" | "module" | "merged" | string;

type GeneratedReport = {
  id: string;
  project_id?: string | null;
  project_name?: string | null;
  module_id?: string | null;
  module_name?: string | null;
  page_name?: string | null;
  report_scope?: ReportScope | null;
  report_title: string;
  report_date?: string | null;
  generated_at?: string | null;
  report_html?: string | null;
  file_name?: string | null;
  file_path?: string | null;
  file_url?: string | null;
  created_by?: string | null;
  is_public?: boolean | null;
  source_report_ids?: string[] | null;
};



const formatDate = (value?: string | null) => {
  if (!value) return "No date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getSupabase = () => {
  return typeof window !== "undefined" ? (window as any).supabase : null;
};

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};


const sanitizePdfFilename = (value: string) => {
  const cleaned = String(value || "generated-report")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "");

  return cleaned || "generated-report";
};

const waitForImages = async (root: ParentNode): Promise<void> => {
  const images = Array.from(root.querySelectorAll("img"));

  if (images.length === 0) return;

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
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

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
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

    reader.onerror = () => {
      reject(reader.error || new Error("Unable to read the generated PDF."));
    };

    reader.readAsDataURL(blob);
  });
};

const convertReportHtmlToPdfBase64 = async (
  reportHtml: string,
  reportTitle: string
): Promise<{
  filename: string;
  pdfBase64: string;
}> => {
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
    visibility: "hidden",
    pointerEvents: "none",
    background: "#ffffff",
  });

  document.body.appendChild(iframe);

  try {
    const iframeDocument =
      iframe.contentDocument || iframe.contentWindow?.document;

    if (!iframeDocument) {
      throw new Error(`Unable to prepare "${reportTitle}" for PDF generation.`);
    }

    iframeDocument.open();
    iframeDocument.write(reportHtml);
    iframeDocument.close();

    await new Promise<void>((resolve) => {
      const finish = () => resolve();

      if (
        iframeDocument.readyState === "complete" ||
        iframeDocument.readyState === "interactive"
      ) {
        window.setTimeout(finish, 500);
        return;
      }

      iframe.addEventListener("load", finish, { once: true });
      window.setTimeout(finish, 2000);
    });

    await waitForImages(iframeDocument);

    const reportElement =
      iframeDocument.querySelector<HTMLElement>(".report-document") ||
      iframeDocument.body;

    if (!reportElement) {
      throw new Error(
        `Unable to find printable content for "${reportTitle}".`
      );
    }

    const contentWidth = Math.max(reportElement.scrollWidth, 1123);
    const contentHeight = Math.max(reportElement.scrollHeight, 794);

    iframe.style.width = `${contentWidth}px`;
    iframe.style.height = `${contentHeight}px`;

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => resolve());
      });
    });

    const canvas = await html2canvas(reportElement, {
      backgroundColor: "#ffffff",
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      logging: false,
      windowWidth: contentWidth,
      windowHeight: contentHeight,
    });

    if (!canvas.width || !canvas.height) {
      throw new Error(`The generated PDF for "${reportTitle}" is empty.`);
    }

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;
    const sourcePageHeightPixels =
      canvas.width * (usableHeight / usableWidth);

    let sourceY = 0;
    let pageIndex = 0;

    while (sourceY < canvas.height) {
      const sliceHeight = Math.min(
        sourcePageHeightPixels,
        canvas.height - sourceY
      );

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.ceil(sliceHeight);

      const pageContext = pageCanvas.getContext("2d");

      if (!pageContext) {
        throw new Error(
          `Unable to create a PDF page for "${reportTitle}".`
        );
      }

      pageContext.fillStyle = "#ffffff";
      pageContext.fillRect(
        0,
        0,
        pageCanvas.width,
        pageCanvas.height
      );

      pageContext.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeight,
        0,
        0,
        pageCanvas.width,
        pageCanvas.height
      );

      const imageData = pageCanvas.toDataURL("image/jpeg", 0.92);
      const renderedHeight =
        usableWidth * (pageCanvas.height / pageCanvas.width);

      if (pageIndex > 0) {
        pdf.addPage("a4", "landscape");
      }

      pdf.addImage(
        imageData,
        "JPEG",
        margin,
        margin,
        usableWidth,
        Math.min(renderedHeight, usableHeight),
        undefined,
        "FAST"
      );

      sourceY += sliceHeight;
      pageIndex += 1;
    }

    const pdfBlob = pdf.output("blob");
    const pdfBase64 = await blobToBase64(pdfBlob);

    return {
      filename: `${sanitizePdfFilename(reportTitle)}.pdf`,
      pdfBase64,
    };
  } finally {
    iframe.remove();
  }
};

export default function ReportsNotificationsPage() {
  const { user, canDeleteRow, canEditRow } = useAccess();
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [scopeFilter, setScopeFilter] = useState("All");
  const [statusMessage, setStatusMessage] = useState("");

  const [recipientInput, setRecipientInput] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedReportName, setMergedReportName] = useState("");

  const loadReports = async () => {
    const supabase = getSupabase();

    if (!supabase) {
      setStatusMessage("Supabase is not connected.");
      return;
    }

    setIsLoading(true);
    setStatusMessage("");

    const { data, error } = await supabase
      .from("generated_reports")
      .select("*")
      .order("generated_at", { ascending: true });

    setIsLoading(false);

    if (error) {
      console.error("[Reports] Load error:", error);
      setStatusMessage("Failed to load generated reports.");
      return;
    }

    setReports(data || []);
  };

  useEffect(() => {
    loadReports();

    const handleReportsUpdated = () => {
      loadReports();
    };

    window.addEventListener("generatedReportsUpdated", handleReportsUpdated);

    return () => {
      window.removeEventListener(
        "generatedReportsUpdated",
        handleReportsUpdated
      );
    };
  }, []);

  const filteredReports = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return reports.filter((report) => {
      const combinedText = [
        report.report_title,
        report.project_name,
        report.module_name,
        report.page_name,
        report.report_scope,
        report.file_name,
      ]
        .join(" ")
        .toLowerCase();

      if (search && !combinedText.includes(search)) return false;

      if (
        projectFilter !== "All" &&
        String(report.project_name || "No Project") !== projectFilter
      ) {
        return false;
      }

      if (
        moduleFilter !== "All" &&
        String(report.module_name || "No Module") !== moduleFilter
      ) {
        return false;
      }

      if (
        scopeFilter !== "All" &&
        String(report.report_scope || "Unknown") !== scopeFilter
      ) {
        return false;
      }

      return true;
    });
  }, [reports, searchText, projectFilter, moduleFilter, scopeFilter]);

  const groupedReports = useMemo(() => {
    const groups: Record<string, GeneratedReport[]> = {};

    filteredReports.forEach((report) => {
      const key =
        report.report_date ||
        (report.generated_at
          ? new Date(report.generated_at).toISOString().split("T")[0]
          : "No Date");

      if (!groups[key]) groups[key] = [];
      groups[key].push(report);
    });

    return Object.entries(groups).sort(([a], [b]) => {
      return String(b).localeCompare(String(a));
    });
  }, [filteredReports]);

  const projectOptions = useMemo(() => {
    const values = reports.map((report) => report.project_name || "No Project");
    return ["All", ...Array.from(new Set(values))];
  }, [reports]);

  const moduleOptions = useMemo(() => {
    const values = reports.map((report) => report.module_name || "No Module");
    return ["All", ...Array.from(new Set(values))];
  }, [reports]);

  const scopeOptions = useMemo(() => {
    const values = reports.map((report) => report.report_scope || "Unknown");
    return ["All", ...Array.from(new Set(values))];
  }, [reports]);

  const selectedReports = useMemo(() => {
    return reports.filter((report) => selectedReportIds.includes(report.id));
  }, [reports, selectedReportIds]);

  const toggleReportSelection = (id: string) => {
    setSelectedReportIds((prev) =>
      prev.includes(id)
        ? prev.filter((reportId) => reportId !== id)
        : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedReportIds([]);
    setMergedReportName("");
  };

  const addRecipient = () => {
    const email = recipientInput.trim();

    if (!email) return;

    if (!isValidEmail(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (recipients.includes(email)) {
      setRecipientInput("");
      return;
    }

    setRecipients((prev) => [...prev, email]);
    setRecipientInput("");
  };

  const removeRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((item) => item !== email));
  };

  const viewReport = (report: GeneratedReport) => {
    if (!report.report_html) {
      alert("This report has no saved HTML preview.");
      return;
    }

    const previewWindow = window.open("", "_blank", "width=1200,height=800");

    if (!previewWindow) {
      alert("Please allow pop-ups to view the report.");
      return;
    }

    previewWindow.document.open();
    previewWindow.document.write(report.report_html);
    previewWindow.document.close();
  };

  const printReport = (report: GeneratedReport) => {
    if (!report.report_html) {
      alert("This report has no saved HTML preview.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1200,height=800");

    if (!printWindow) {
      alert("Please allow pop-ups to print the report.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(report.report_html);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 700);
  };

  const deleteReport = async (report: GeneratedReport) => {
    if (!canDeleteRow("reports-notifications", report)) {
      alert("You are not allowed to delete this report.");
      return;
    }
    const confirmDelete = confirm(
      `Delete this report?\n\n${report.report_title}`
    );

    if (!confirmDelete) return;

    const supabase = getSupabase();

    if (!supabase) {
      alert("Supabase is not connected.");
      return;
    }

    const { error } = await supabase
      .from("generated_reports")
      .delete()
      .eq("id", report.id);

    if (error) {
      console.error("[Reports] Delete error:", error);
      alert("Failed to delete report.");
      return;
    }

    setReports((prev) => prev.filter((item) => item.id !== report.id));
    setSelectedReportIds((prev) => prev.filter((id) => id !== report.id));
    window.dispatchEvent(new CustomEvent("generatedReportsUpdated"));
  };

  const toggleReportPublicStatus = async (report: GeneratedReport) => {
    if (!canEditRow("reports-notifications", report)) {
      alert("You are not allowed to edit this report.");
      return;
    }
    const supabase = getSupabase();

    if (!supabase) {
      alert("Supabase is not connected.");
      return;
    }

    const nextValue = !report.is_public;

    const { error } = await supabase
      .from("generated_reports")
      .update({ is_public: nextValue })
      .eq("id", report.id);

    if (error) {
      console.error("[Reports] Failed to update public status:", error);
      alert("Failed to update public status.");
      return;
    }

    setReports((prev) =>
      prev.map((item) =>
        item.id === report.id ? { ...item, is_public: nextValue } : item
      )
    );

    window.dispatchEvent(new CustomEvent("generatedReportsUpdated"));
  };

  const buildMergedReportHtml = (reportsWithHtml: GeneratedReport[]) => {
    const extractHeadStyles = (html: string) => {
      const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
      const headContent = headMatch?.[1] || "";

      const styleTags =
        headContent.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || "";
      const metaTags = headContent.match(/<meta[^>]*>/gi) || "";

      return `
        ${Array.isArray(metaTags) ? metaTags.join("\n") : metaTags}
        ${Array.isArray(styleTags) ? styleTags.join("\n") : styleTags}
      `;
    };

    const extractBodyContent = (html: string) => {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      let bodyContent = bodyMatch?.[1] || html;

      bodyContent = bodyContent.replace(
        /<script[^>]*>[\s\S]*?<\/script>/gi,
        ""
      );

      return bodyContent;
    };

    const baseStyles = extractHeadStyles(reportsWithHtml[0].report_html || "");

    const mergedSections = reportsWithHtml
      .map((report, index) => {
        const bodyContent = extractBodyContent(report.report_html || "");

        return `
          <section class="merged-report-section ${
            index === reportsWithHtml.length - 1 ? "last-merged-section" : ""
          }">
            ${bodyContent}
          </section>
        `;
      })
      .join("");

    const customMergedName = mergedReportName.trim();

const mergedTitle =
  customMergedName ||
  (reportsWithHtml.length === 1
    ? `Merged Report - ${reportsWithHtml[0].report_title}`
    : `Merged Report - ${reportsWithHtml.length} Reports`);

    const mergedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>${mergedTitle}</title>

          ${baseStyles}

          <style>
            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: Aptos, "Segoe UI", Calibri, Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            body {
              max-width: none !important;
              width: 100% !important;
              padding: 0 !important;
            }

            .merged-report-section {
              page-break-after: always;
              break-after: page;
            }

            .merged-report-section.last-merged-section {
              page-break-after: auto;
              break-after: auto;
            }

            .merged-report-section .report-document {
              width: 100%;
              max-width: 100%;
            }

            @media screen {
              body {
                max-width: 1123px !important;
                margin: 0 auto !important;
                padding: 24px !important;
              }

              .merged-report-section {
                margin-bottom: 32px;
                border-bottom: 1px dashed #cbd5e1;
                padding-bottom: 32px;
              }

              .merged-report-section.last-merged-section {
                border-bottom: none;
                margin-bottom: 0;
              }
            }

            @media print {
              @page {
                size: A4 landscape;
                margin: 9mm;
              }

              body {
                padding: 0 !important;
              }

              .merged-report-section {
                page-break-after: always;
                break-after: page;
              }

              .merged-report-section.last-merged-section {
                page-break-after: auto;
                break-after: auto;
              }
            }
          </style>
        </head>

        <body>
          ${mergedSections}
        </body>
      </html>
    `;

    return { mergedTitle, mergedHtml };
  };

  const mergeSelectedReports = async () => {
    if (selectedReports.length === 0) {
      alert("Please select reports to merge.");
      return;
    }

    const reportsWithHtml = selectedReports.filter(
      (report) => report.report_html
    );

    if (reportsWithHtml.length === 0) {
      alert("Selected reports do not have saved HTML content.");
      return;
    }

    const supabase = getSupabase();

    if (!supabase) {
      alert("Supabase is not connected.");
      return;
    }

    setIsMerging(true);

    const { mergedTitle, mergedHtml } = buildMergedReportHtml(reportsWithHtml);
    const now = new Date();
    const datePart = now.toISOString().split("T")[0];

    const mergedWindow = window.open("", "_blank", "width=1200,height=800");

    if (!mergedWindow) {
      setIsMerging(false);
      alert("Please allow pop-ups to merge reports.");
      return;
    }

    mergedWindow.document.open();
    mergedWindow.document.write(mergedHtml);
    mergedWindow.document.close();

    const firstReport = reportsWithHtml[0];

    const payload = {
      project_id: firstReport.project_id || null,
      project_name: firstReport.project_name || null,
      module_id: firstReport.module_id || null,
      module_name: firstReport.module_name || "Merged Reports",
      page_name: null,
      report_scope: "merged",
      report_title: mergedTitle,
      report_date: datePart,
      generated_at: now.toISOString(),
      report_html: mergedHtml,
      file_name: `${datePart}-merged-report.html`,
      file_path: null,
      file_url: null,
      created_by: user?.id || null,
      is_public: false,
      source_report_ids: reportsWithHtml.map((report) => report.id),
    };

    const { data, error } = await supabase
      .from("generated_reports")
      .insert(payload)
      .select()
      .single();

    setIsMerging(false);

    if (error) {
      console.error("[Reports] Failed to save merged report:", error);
      alert(
        `Merged report opened but failed to save.\n\n${
          error.message || "Unknown error"
        }`
      );
      return;
    }

    setReports((prev) => [data, ...prev]);
    setSelectedReportIds([]);
    setMergedReportName("");
    window.dispatchEvent(new CustomEvent("generatedReportsUpdated"));

    alert("Merged report saved to Reports page as Private.");
  };

  const sendSelectedReports = async () => {
  if (selectedReports.length === 0) {
    alert("Please select reports first.");
    return;
  }

  if (recipients.length === 0) {
    alert("Please add at least one recipient email.");
    return;
  }

  const invalidRecipients = recipients.filter(
    (recipient) => !isValidEmail(recipient)
  );

  if (invalidRecipients.length > 0) {
    alert(
      `Please correct these invalid email addresses:\n\n${invalidRecipients.join(
        "\n"
      )}`
    );
    return;
  }

  const reportsWithHtml = selectedReports.filter(
    (report) =>
      typeof report.report_html === "string" &&
      report.report_html.trim().length > 0
  );

  if (reportsWithHtml.length === 0) {
    alert("Selected reports do not have saved HTML content.");
    return;
  }

  setIsSending(true);

  try {
    const preparedReports = [];

    for (const report of reportsWithHtml) {
      const reportTitle =
        report.report_title || "Generated Report";

      const generatedPdf =
        await convertReportHtmlToPdfBase64(
          report.report_html || "",
          reportTitle
        );

      preparedReports.push({
        id: report.id,
        title: reportTitle,
        projectName: report.project_name,
        moduleName: report.module_name,
        pageName: report.page_name,
        scope: report.report_scope,
        generatedAt: report.generated_at,

        // These two fields are required by the email API.
        filename: generatedPdf.filename,
        pdfBase64: generatedPdf.pdfBase64,
      });
    }

    console.log(
      "[Reports] Prepared PDF attachments:",
      preparedReports.map((report) => ({
        filename: report.filename,
        base64Length: report.pdfBase64?.length || 0,
      }))
    );

    const response = await fetch(
      "/api/send-generated-reports",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients,
          reports: preparedReports,
        }),
      }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("[Reports] Send email error:", result);

      const apiError =
        result?.error?.message ||
        result?.error ||
        "Unknown email error.";

      throw new Error(
        typeof apiError === "string"
          ? apiError
          : JSON.stringify(apiError)
      );
    }

    console.log(
      "[Reports] Email sent with attachments:",
      result
    );

    alert(
      `${result?.attachmentCount || preparedReports.length} PDF attachment${
        preparedReports.length === 1 ? "" : "s"
      } sent successfully.`
    );
  } catch (error) {
    console.error(
      "[Reports] Send email request failed:",
      error
    );

    alert(
      `Failed to send email.\n\n${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    );
  } finally {
    setIsSending(false);
  }
};

  return (
    <PageContainer
      title="Reports"
      description="View, compile, merge, and send generated reports."
      actions={
        <>
          <button
            onClick={loadReports}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </>
      }
    >
      <div className="space-y-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#38414a] rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Reports
            </p>
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
              {reports.length}
            </p>
          </div>

          <div className="bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#38414a] rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Selected
            </p>
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
              {selectedReportIds.length}
            </p>
          </div>

          <div className="bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#38414a] rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Page Reports
            </p>
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
              {
                reports.filter(
                  (report) => String(report.report_scope) === "page"
                ).length
              }
            </p>
          </div>

          <div className="bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#38414a] rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Module Reports
            </p>
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
              {
                reports.filter(
                  (report) => String(report.report_scope) === "module"
                ).length
              }
            </p>
          </div>

          <div className="bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#38414a] rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Public Reports
            </p>
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
              {reports.filter((report) => report.is_public).length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#38414a] rounded-xl p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search reports..."
                  className="w-full h-10 pl-9 pr-3 bg-gray-50 dark:bg-[#22272b] border border-gray-300 dark:border-[#38414a] rounded-md text-sm outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 dark:bg-[#22272b] border border-gray-300 dark:border-[#38414a] rounded-md text-sm outline-none focus:border-blue-500 text-gray-900 dark:text-white"
              >
                {projectOptions.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>

              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 dark:bg-[#22272b] border border-gray-300 dark:border-[#38414a] rounded-md text-sm outline-none focus:border-blue-500 text-gray-900 dark:text-white"
              >
                {moduleOptions.map((module) => (
                  <option key={module} value={module}>
                    {module}
                  </option>
                ))}
              </select>

              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 dark:bg-[#22272b] border border-gray-300 dark:border-[#38414a] rounded-md text-sm outline-none focus:border-blue-500 text-gray-900 dark:text-white"
              >
                {scopeOptions.map((scope) => (
                  <option key={scope} value={scope}>
                    {scope}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-200 dark:border-[#38414a] pt-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {recipients.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-100 dark:border-blue-800"
                  >
                    <Mail size={13} />
                    {email}
                    <button
                      type="button"
                      onClick={() => removeRecipient(email)}
                      className="text-blue-400 hover:text-red-500"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRecipient();
                    }
                  }}
                  placeholder="Add recipient email..."
                  className="h-10 min-w-[240px] px-3 bg-gray-50 dark:bg-[#22272b] border border-gray-300 dark:border-[#38414a] rounded-md text-sm outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                />

                <button
                  type="button"
                  onClick={addRecipient}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <Plus size={16} />
                  Add Email
                </button>

                <input
  value={mergedReportName}
  onChange={(e) => setMergedReportName(e.target.value)}
  placeholder="Merged report name..."
  className="h-10 min-w-[240px] px-3 bg-gray-50 dark:bg-[#22272b] border border-gray-300 dark:border-[#38414a] rounded-md text-sm outline-none focus:border-blue-500 text-gray-900 dark:text-white"
/>

                <button
                  onClick={mergeSelectedReports}
                  disabled={isMerging}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Download size={16} />
                  {isMerging ? "Merging..." : "Merge Selected"}
                </button>

                <button
                  onClick={sendSelectedReports}
                  disabled={isSending}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={16} />
                  {isSending ? "Sending..." : "Send Selected"}
                </button>

                {selectedReportIds.length > 0 && (
                  <button
                    onClick={clearSelection}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {statusMessage && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={16} />
              {statusMessage}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#1d2125] border border-gray-200 dark:border-[#38414a] rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-[#38414a] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Generated Reports Library
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Generated and merged reports are saved here. Mark a report as
                Public to show it on the homepage.
              </p>
            </div>

            {isLoading && (
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Loading...
              </span>
            )}
          </div>

          {groupedReports.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center px-6">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                No generated reports yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                Generate a page or module report first. Once saved, it will
                appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-[#38414a]">
              {groupedReports.map(([dateKey, dateReports]) => (
                <div key={dateKey}>
                  <div className="px-5 py-3 bg-gray-50 dark:bg-[#22272b] border-b border-gray-200 dark:border-[#38414a] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-blue-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        {formatDate(dateKey)}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {dateReports.length} report
                      {dateReports.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white dark:bg-[#1d2125]">
                        <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-[#38414a]">
                          <th className="px-5 py-3 w-12"></th>
                          <th className="px-5 py-3">Report</th>
                          <th className="px-5 py-3">Project</th>
                          <th className="px-5 py-3">Module / Page</th>
                          <th className="px-5 py-3">Scope</th>
                          <th className="px-5 py-3">Visibility</th>
                          <th className="px-5 py-3">Generated</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100 dark:divide-[#38414a]">
                        {dateReports.map((report) => {
                          const isSelected = selectedReportIds.includes(
                            report.id
                          );

                          return (
                            <tr
                              key={report.id}
                              className={
                                isSelected
                                  ? "bg-blue-50 dark:bg-blue-900/10"
                                  : "hover:bg-gray-50 dark:hover:bg-[#22272b]"
                              }
                            >
                              <td className="px-5 py-4">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    toggleReportSelection(report.id)
                                  }
                                  className="rounded text-blue-600 focus:ring-blue-500"
                                />
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <FileText size={18} />
                                  </div>

                                  <div>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                      {report.report_title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {report.file_name || "Saved report HTML"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                                {report.project_name || "-"}
                              </td>

                              <td className="px-5 py-4">
                                <div className="text-gray-700 dark:text-gray-300">
                                  {report.module_name || "-"}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {report.page_name || "-"}
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase">
                                  {report.report_scope || "Unknown"}
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <button
                                  onClick={() =>
                                    toggleReportPublicStatus(report)
                                  }
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                                    report.is_public
                                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300"
                                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                                  }`}
                                  title={
                                    report.is_public
                                      ? "Visible on homepage"
                                      : "Hidden from homepage"
                                  }
                                >
                                  {report.is_public ? (
                                    <Globe2 size={13} />
                                  ) : (
                                    <Lock size={13} />
                                  )}
                                  {report.is_public ? "Public" : "Private"}
                                </button>
                              </td>

                              <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                                {formatDateTime(report.generated_at)}
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => viewReport(report)}
                                    className="p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    title="View report"
                                  >
                                    <Eye size={16} />
                                  </button>

                                  <button
                                    onClick={() => printReport(report)}
                                    className="p-2 rounded-md text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                    title="Print report"
                                  >
                                    <Printer size={16} />
                                  </button>

                                  <button
                                    onClick={() => deleteReport(report)}
                                    className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    title="Delete report"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}