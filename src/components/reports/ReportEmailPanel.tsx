import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Edit3,
  History,
  Mail,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { generateReportPdf } from "../../utils/reportPdf";

type Report = {
  id: string;
  project_id?: string | number | null;
  project_name?: string | null;
  report_title: string;
  report_html?: string | null;
  module_name?: string | null;
  page_name?: string | null;
  report_scope?: string | null;
  generated_at?: string | null;
};

type EmailGroup = {
  id: string;
  project_id?: string | number | null;
  group_name: string;
  email_addresses: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
};

type EmailHistory = {
  id: string;
  report_name: string;
  recipient_email_addresses: string[];
  email_subject: string;
  sending_status: "processing" | "sent" | "partial" | "failed";
  error_message?: string | null;
  sent_at: string;
};

type Props = {
  selectedReports: Report[];
  userId?: string | null;
};

const getSupabase = () =>
  typeof window !== "undefined" ? (window as any).supabase : null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmails(value: string | string[]) {
  const parts = Array.isArray(value)
    ? value
    : value.split(/[;,\n]+/g);
  return Array.from(
    new Set(parts.map((item) => item.trim().toLowerCase()).filter(Boolean))
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function ReportEmailPanel({ selectedReports, userId }: Props) {
  const [groups, setGroups] = useState<EmailGroup[]>([]);
  const [history, setHistory] = useState<EmailHistory[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [individualInput, setIndividualInput] = useState("");
  const [individualRecipients, setIndividualRecipients] = useState<string[]>([]);
  const [validationError, setValidationError] = useState("");
  const [subject, setSubject] = useState("Generated Report from STEC Portal");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [showGroupEditor, setShowGroupEditor] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupEmailsInput, setGroupEmailsInput] = useState("");

  const projectIds = useMemo(
    () =>
      Array.from(
        new Set(
          selectedReports
            .map((report) => report.project_id)
            .filter((value) => value !== null && value !== undefined)
            .map(String)
        )
      ),
    [selectedReports]
  );
  const selectedProjectId = projectIds.length === 1 ? projectIds[0] : null;
  const selectedProjectName =
    projectIds.length === 1 ? selectedReports[0]?.project_name || "-" : "Multiple projects";

  const finalRecipients = useMemo(() => {
    const groupEmails = groups
      .filter((group) => selectedGroupIds.includes(group.id))
      .flatMap((group) => group.email_addresses || []);
    return normalizeEmails([...groupEmails, ...individualRecipients]);
  }, [groups, selectedGroupIds, individualRecipients]);

  const selectedGroupNames = useMemo(
    () =>
      groups
        .filter((group) => selectedGroupIds.includes(group.id))
        .map((group) => group.group_name),
    [groups, selectedGroupIds]
  );

  const loadGroups = async () => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    let query = supabase
      .from("report_email_groups")
      .select("*")
      .order("group_name", { ascending: true });
    if (selectedProjectId) {
      query = query.or(`project_id.eq.${selectedProjectId},project_id.is.null`);
    }
    const { data, error } = await query;
    if (error) {
      setStatusMessage(`Failed to load email groups: ${error.message}`);
      return;
    }
    setGroups(data || []);
  };

  const loadHistory = async () => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    let query = supabase
      .from("report_email_history")
      .select("id,report_name,recipient_email_addresses,email_subject,sending_status,error_message,sent_at")
      .order("sent_at", { ascending: false })
      .limit(10);
    if (selectedProjectId) query = query.eq("project_id", selectedProjectId);
    const { data } = await query;
    setHistory(data || []);
  };

  useEffect(() => {
    loadGroups();
    loadHistory();
  }, [userId, selectedProjectId]);

  const addIndividualRecipients = () => {
    const parsed = normalizeEmails(individualInput);
    const invalid = parsed.filter((email) => !EMAIL_PATTERN.test(email));
    if (invalid.length) {
      setValidationError(`Invalid email address${invalid.length > 1 ? "es" : ""}: ${invalid.join(", ")}`);
      return;
    }
    setIndividualRecipients((current) => normalizeEmails([...current, ...parsed]));
    setIndividualInput("");
    setValidationError("");
  };

  const openCreateGroup = () => {
    setEditingGroupId(null);
    setGroupName("");
    setGroupEmailsInput("");
    setShowGroupEditor(true);
  };

  const openEditGroup = (group: EmailGroup) => {
    setEditingGroupId(group.id);
    setGroupName(group.group_name);
    setGroupEmailsInput(group.email_addresses.join("; "));
    setShowGroupEditor(true);
  };

  const saveGroup = async () => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    const emails = normalizeEmails(groupEmailsInput);
    const invalid = emails.filter((email) => !EMAIL_PATTERN.test(email));
    if (!groupName.trim()) {
      setValidationError("Email group name is required.");
      return;
    }
    if (!emails.length || invalid.length) {
      setValidationError(
        invalid.length
          ? `Invalid email address${invalid.length > 1 ? "es" : ""}: ${invalid.join(", ")}`
          : "Add at least one valid email address to the group."
      );
      return;
    }

    const payload = {
      project_id: selectedProjectId ? Number(selectedProjectId) : null,
      group_name: groupName.trim(),
      email_addresses: emails,
      created_by: userId,
    };
    const response = editingGroupId
      ? await supabase
          .from("report_email_groups")
          .update({
            group_name: payload.group_name,
            email_addresses: payload.email_addresses,
            project_id: payload.project_id,
          })
          .eq("id", editingGroupId)
          .select()
          .single()
      : await supabase
          .from("report_email_groups")
          .insert(payload)
          .select()
          .single();

    if (response.error) {
      setValidationError(response.error.message);
      return;
    }
    setShowGroupEditor(false);
    setValidationError("");
    await loadGroups();
  };

  const deleteGroup = async (group: EmailGroup) => {
    if (!confirm(`Delete email group "${group.group_name}"?`)) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase.from("report_email_groups").delete().eq("id", group.id);
    if (error) {
      setStatusMessage(`Failed to delete group: ${error.message}`);
      return;
    }
    setSelectedGroupIds((current) => current.filter((id) => id !== group.id));
    await loadGroups();
  };

  const validateBeforeConfirmation = () => {
    if (!selectedReports.length) {
      setValidationError("Select at least one report from the report library.");
      return;
    }
    if (!finalRecipients.length) {
      setValidationError("Select an email group or add at least one individual recipient.");
      return;
    }
    const invalid = finalRecipients.filter((email) => !EMAIL_PATTERN.test(email));
    if (invalid.length) {
      setValidationError(`Invalid email addresses: ${invalid.join(", ")}`);
      return;
    }
    if (!subject.trim()) {
      setValidationError("Email subject is required.");
      return;
    }
    setValidationError("");
    setShowConfirmation(true);
  };

  const saveHistory = async (payload: Record<string, unknown>) => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    await supabase.from("report_email_history").insert(payload);
  };

  const sendReport = async () => {
    if (!userId) {
      setValidationError("You must be signed in to send reports.");
      return;
    }
    setShowConfirmation(false);
    setIsSending(true);
    setStatusMessage("Generating the latest PDF and sending the report...");

    const reportsWithHtml = selectedReports.filter(
      (report) => typeof report.report_html === "string" && report.report_html.trim()
    );
    if (!reportsWithHtml.length) {
      setIsSending(false);
      setValidationError("The selected reports do not contain saved HTML content.");
      return;
    }

    let preparedReports: Array<Record<string, unknown>> = [];
    try {
      for (const report of reportsWithHtml) {
        const pdf = await generateReportPdf(report.report_html || "", report.report_title);
        preparedReports.push({
          id: report.id,
          title: report.report_title,
          projectName: report.project_name,
          moduleName: report.module_name,
          pageName: report.page_name,
          scope: report.report_scope,
          generatedAt: report.generated_at,
          filename: pdf.filename,
          pdfBase64: pdf.pdfBase64,
          pageCount: pdf.pageCount,
          orientation: pdf.orientation,
        });
      }

      const response = await fetch("/api/send-generated-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: finalRecipients,
          subject: subject.trim(),
          message: message.trim(),
          reports: preparedReports,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const errorText = result?.error?.message || result?.error || `Email request failed with status ${response.status}.`;
        throw new Error(typeof errorText === "string" ? errorText : JSON.stringify(errorText));
      }

      const successCount = Number(result?.successCount || 0);
      const failureCount = Number(result?.failureCount || 0);
      const sendingStatus = failureCount === 0 ? "sent" : successCount > 0 ? "partial" : "failed";
      const failures = Array.isArray(result?.failures) ? result.failures : [];

      await saveHistory({
        project_id: selectedProjectId ? Number(selectedProjectId) : null,
        report_name:
          selectedReports.length === 1
            ? selectedReports[0].report_title
            : `${selectedReports.length} selected reports`,
        report_ids: selectedReports.map((report) => report.id),
        recipient_email_addresses: finalRecipients,
        selected_group_names: selectedGroupNames,
        email_subject: subject.trim(),
        email_message: message.trim() || null,
        pdf_filenames: preparedReports.map((report) => report.filename),
        sender_user_id: userId,
        sending_status: sendingStatus,
        provider_message_ids: result?.messageIds || null,
        provider_response: result || null,
        error_message: failures.length ? JSON.stringify(failures) : null,
        sent_at: new Date().toISOString(),
      });

      setStatusMessage(
        failureCount
          ? `Sent to ${successCount} recipient(s); ${failureCount} failed. ${failures
              .map((failure: any) => `${failure.recipient}: ${failure.error}`)
              .join(" | ")}`
          : `Report sent successfully to ${successCount} recipient(s).`
      );
      await loadHistory();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await saveHistory({
        project_id: selectedProjectId ? Number(selectedProjectId) : null,
        report_name:
          selectedReports.length === 1
            ? selectedReports[0].report_title
            : `${selectedReports.length} selected reports`,
        report_ids: selectedReports.map((report) => report.id),
        recipient_email_addresses: finalRecipients,
        selected_group_names: selectedGroupNames,
        email_subject: subject.trim(),
        email_message: message.trim() || null,
        pdf_filenames: preparedReports.map((report) => report.filename),
        sender_user_id: userId,
        sending_status: "failed",
        error_message: errorMessage,
        sent_at: new Date().toISOString(),
      });
      setStatusMessage(`Failed to send report: ${errorMessage}`);
      await loadHistory();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4 border-t border-gray-200 dark:border-[#38414a] pt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Send Report</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Selected report(s): {selectedReports.length}. Recipient privacy is protected by sending a separate email to each address.
          </p>
        </div>
        <button type="button" onClick={openCreateGroup} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-semibold">
          <Plus size={15} /> New Email Group
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-[#38414a] p-4">
          <p className="text-sm font-bold mb-3">Saved email groups</p>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {groups.length === 0 && <p className="text-sm text-gray-500">No saved groups for this project yet.</p>}
            {groups.map((group) => (
              <div key={group.id} className="flex items-start gap-3 rounded-md border p-3">
                <input
                  type="checkbox"
                  checked={selectedGroupIds.includes(group.id)}
                  onChange={() =>
                    setSelectedGroupIds((current) =>
                      current.includes(group.id)
                        ? current.filter((id) => id !== group.id)
                        : [...current, group.id]
                    )
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{group.group_name}</p>
                  <p className="text-xs text-gray-500 break-words">{group.email_addresses.join(", ")}</p>
                  <p className="text-[11px] text-gray-400 mt-1">Updated {formatDate(group.updated_at)}</p>
                </div>
                <button type="button" onClick={() => openEditGroup(group)} title="Edit group"><Edit3 size={15} /></button>
                <button type="button" onClick={() => deleteGroup(group)} title="Delete group" className="text-red-600"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-[#38414a] p-4 space-y-3">
          <label className="block text-sm font-bold">Additional recipients</label>
          <div className="flex gap-2">
            <input
              value={individualInput}
              onChange={(event) => setIndividualInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addIndividualRecipients();
                }
              }}
              placeholder="email1@company.com; email2@company.com"
              className="h-10 flex-1 px-3 rounded-md border bg-transparent text-sm"
            />
            <button type="button" onClick={addIndividualRecipients} className="px-3 rounded-md border font-semibold text-sm">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {individualRecipients.map((email) => (
              <span key={email} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                <Mail size={12} /> {email}
                <button type="button" onClick={() => setIndividualRecipients((current) => current.filter((item) => item !== email))}><X size={12} /></button>
              </span>
            ))}
          </div>
          <label className="block text-sm font-bold">Subject</label>
          <input value={subject} onChange={(event) => setSubject(event.target.value)} className="h-10 w-full px-3 rounded-md border bg-transparent text-sm" />
          <label className="block text-sm font-bold">Optional message</label>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} className="w-full px-3 py-2 rounded-md border bg-transparent text-sm" />
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 dark:bg-[#22272b] p-3 text-sm">
        <strong>Final recipients ({finalRecipients.length}):</strong>{" "}
        {finalRecipients.length ? finalRecipients.join(", ") : "None selected"}
      </div>

      {validationError && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{validationError}</div>}
      {statusMessage && <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">{statusMessage}</div>}

      <button
        type="button"
        onClick={validateBeforeConfirmation}
        disabled={isSending}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-600 text-white font-semibold disabled:opacity-60"
      >
        {isSending ? <Save size={17} className="animate-pulse" /> : <Send size={17} />}
        {isSending ? "Generating and sending..." : "Send Report"}
      </button>

      <div className="rounded-lg border border-gray-200 dark:border-[#38414a] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b font-bold"><History size={16} /> Recent email history</div>
        {history.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No report emails recorded yet.</p>
        ) : (
          <div className="divide-y">
            {history.map((item) => (
              <div key={item.id} className="p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <strong>{item.report_name}</strong>
                  <span className="uppercase text-xs font-bold">{item.sending_status}</span>
                </div>
                <p className="text-xs text-gray-500">{item.email_subject} · {item.recipient_email_addresses.length} recipient(s) · {formatDate(item.sent_at)}</p>
                {item.error_message && <p className="text-xs text-red-600 mt-1">{item.error_message}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showGroupEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#1d2125] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{editingGroupId ? "Edit email group" : "Create email group"}</h3>
              <button onClick={() => setShowGroupEditor(false)}><X size={18} /></button>
            </div>
            <input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Group name" className="h-10 w-full px-3 rounded-md border bg-transparent" />
            <textarea value={groupEmailsInput} onChange={(event) => setGroupEmailsInput(event.target.value)} placeholder="Separate emails with commas, semicolons, or new lines" rows={5} className="w-full px-3 py-2 rounded-md border bg-transparent" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowGroupEditor(false)} className="px-4 py-2 rounded-md border">Cancel</button>
              <button onClick={saveGroup} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white"><Save size={16} /> Save Group</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-[#1d2125] p-5 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Confirm report email</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Report:</strong> {selectedReports.map((report) => report.report_title).join(", ")}</p>
              <p><strong>Project:</strong> {selectedProjectName}</p>
              <p><strong>Subject:</strong> {subject}</p>
              <p><strong>Total recipients:</strong> {finalRecipients.length}</p>
              <p className="break-words"><strong>Final recipient list:</strong> {finalRecipients.join(", ")}</p>
              <p><strong>PDF filename:</strong> {selectedReports.map((report) => `${report.report_title}.pdf`).join(", ")}</p>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 rounded-md border">Cancel</button>
              <button onClick={sendReport} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white"><CheckCircle size={16} /> Confirm and Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
