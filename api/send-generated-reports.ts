declare const process: {
  env: {
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    EMAIL_REPLY_TO?: string;
  };
};

import { Resend } from "resend";

type EmailAttachment = { filename: string; content: string };
type GeneratedReportPayload = {
  id?: string;
  title?: string;
  projectName?: string;
  moduleName?: string;
  pageName?: string;
  scope?: string;
  generatedAt?: string;
  filename?: string;
  pdfBase64?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeFilename(value: unknown) {
  const cleaned = String(value || "generated-report")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "");
  return cleaned || "generated-report";
}

function normalizeRecipients(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((recipient) => String(recipient || "").trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function errorToString(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown email provider error.";
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: "RESEND_API_KEY is not configured in Vercel." });
    }
    if (!process.env.EMAIL_FROM) {
      return res.status(500).json({
        error: "EMAIL_FROM is not configured. Use a verified sender such as 'STEC Portal <reports@yourdomain.com>'.",
      });
    }

    const { recipients, reports, subject, message } = req.body || {};
    const normalizedRecipients = normalizeRecipients(recipients);
    const invalidRecipients = normalizedRecipients.filter(
      (recipient) => !EMAIL_PATTERN.test(recipient)
    );

    if (!normalizedRecipients.length) {
      return res.status(400).json({ error: "No recipient email address was provided." });
    }
    if (invalidRecipients.length) {
      return res.status(400).json({
        error: `Invalid recipient email address${invalidRecipients.length > 1 ? "es" : ""}: ${invalidRecipients.join(", ")}`,
      });
    }
    if (!Array.isArray(reports) || !reports.length) {
      return res.status(400).json({ error: "No reports were provided." });
    }

    const validReports = reports as GeneratedReportPayload[];
    const attachments: EmailAttachment[] = validReports
      .filter((report) => typeof report.pdfBase64 === "string" && report.pdfBase64.trim())
      .map((report, index) => {
        const baseName = sanitizeFilename(report.filename || report.title || `generated-report-${index + 1}`);
        return {
          filename: baseName.toLowerCase().endsWith(".pdf") ? baseName : `${baseName}.pdf`,
          content: report.pdfBase64 as string,
        };
      });

    if (!attachments.length) {
      return res.status(400).json({ error: "No valid PDF attachment was received by the email API." });
    }

    const reportListHtml = validReports
      .map(
        (report, index) => `
          <div style="margin-bottom:14px;padding:12px;border:1px solid #e5e7eb;border-radius:8px;">
            <strong>${index + 1}. ${escapeHtml(report.title || "Generated Report")}</strong><br/>
            <span style="font-size:13px;color:#475569;line-height:1.6;">
              Project: ${escapeHtml(report.projectName || "-")}<br/>
              Module: ${escapeHtml(report.moduleName || "-")}<br/>
              Page: ${escapeHtml(report.pageName || "-")}<br/>
              Attachment: ${escapeHtml(attachments[index]?.filename || "report.pdf")}
            </span>
          </div>`
      )
      .join("");

    const customMessage = String(message || "").trim();
    const html = `<!doctype html>
      <html><body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:760px;margin:0 auto;padding:24px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;">
          <h2 style="margin:0 0 12px;">Generated Report${validReports.length > 1 ? "s" : ""}</h2>
          ${customMessage ? `<p style="white-space:pre-wrap;color:#334155;">${escapeHtml(customMessage)}</p>` : ""}
          <p style="color:#475569;">The selected report PDF${attachments.length > 1 ? "s are" : " is"} attached.</p>
          ${reportListHtml}
          <p style="font-size:12px;color:#64748b;margin-top:20px;">Sent from STEC Portal.</p>
        </div>
      </body></html>`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const emailSubject = String(subject || "Generated Report from STEC Portal").trim();

    // Separate emails protect recipient privacy and allow partial-failure reporting.
    const settled = await Promise.allSettled(
      normalizedRecipients.map(async (recipient) => {
        const { data, error } = await resend.emails.send({
          from: process.env.EMAIL_FROM as string,
          to: [recipient],
          ...(process.env.EMAIL_REPLY_TO ? { replyTo: process.env.EMAIL_REPLY_TO } : {}),
          subject: emailSubject,
          html,
          attachments,
        });
        if (error) throw new Error(errorToString(error));
        return { recipient, messageId: data?.id || null };
      })
    );

    const successes = settled
      .filter((result): result is PromiseFulfilledResult<{ recipient: string; messageId: string | null }> => result.status === "fulfilled")
      .map((result) => result.value);
    const failures = settled
      .map((result, index) => ({ result, recipient: normalizedRecipients[index] }))
      .filter((item): item is { result: PromiseRejectedResult; recipient: string } => item.result.status === "rejected")
      .map((item) => ({ recipient: item.recipient, error: errorToString(item.result.reason) }));

    const statusCode = successes.length > 0 ? 200 : 502;
    return res.status(statusCode).json({
      success: failures.length === 0,
      successCount: successes.length,
      failureCount: failures.length,
      messageIds: successes,
      failures,
      attachmentCount: attachments.length,
      deliveryMode: "separate_email_per_recipient",
    });
  } catch (error) {
    console.error("[Vercel API] Send generated reports error:", error);
    return res.status(500).json({ error: errorToString(error) });
  }
}
