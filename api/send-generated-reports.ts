declare const process: {
  env: {
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
  };
};

import { Resend } from "resend";

type EmailAttachment = {
  filename: string;
  content: string;
};

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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed.",
    });
  }

  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return res.status(500).json({
        error: "RESEND_API_KEY is not configured in Vercel.",
      });
    }

    const { recipients, reports } = req.body || {};

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        error: "No recipients provided.",
      });
    }

    if (!Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({
        error: "No reports provided.",
      });
    }

    const validRecipients = recipients
      .map((recipient: unknown) => String(recipient || "").trim())
      .filter(Boolean);

    if (validRecipients.length === 0) {
      return res.status(400).json({
        error: "No valid recipient email was provided.",
      });
    }

    const validReports = reports as GeneratedReportPayload[];

    const attachments: EmailAttachment[] = validReports
      .filter(
        (report) =>
          typeof report.pdfBase64 === "string" &&
          report.pdfBase64.trim().length > 0
      )
      .map((report, index) => {
        const baseName = sanitizeFilename(
          report.filename ||
            report.title ||
            `generated-report-${index + 1}`
        );

        const filename = baseName.toLowerCase().endsWith(".pdf")
          ? baseName
          : `${baseName}.pdf`;

        return {
          filename,
          content: report.pdfBase64 as string,
        };
      });

    if (attachments.length === 0) {
      return res.status(400).json({
        error: "No PDF attachment was received by the email API.",
      });
    }

    const reportListHtml = validReports
      .map((report, index) => {
        const attachmentName =
          attachments[index]?.filename ||
          `${sanitizeFilename(report.title)}.pdf`;

        return `
          <div
            style="
              margin-bottom:16px;
              padding:14px;
              border:1px solid #e5e7eb;
              border-radius:8px;
              background:#ffffff;
            "
          >
            <h3 style="margin:0 0 8px;font-size:16px;color:#0f172a;">
              ${index + 1}. ${escapeHtml(
                report.title || "Generated Report"
              )}
            </h3>

            <p
              style="
                margin:0;
                color:#475569;
                font-size:13px;
                line-height:1.6;
              "
            >
              Project: ${escapeHtml(report.projectName || "-")}<br/>
              Module: ${escapeHtml(report.moduleName || "-")}<br/>
              Page: ${escapeHtml(report.pageName || "-")}<br/>
              Scope: ${escapeHtml(report.scope || "-")}<br/>
              Generated: ${escapeHtml(report.generatedAt || "-")}<br/>
              Attachment: ${escapeHtml(attachmentName)}
            </p>
          </div>
        `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Generated Reports from STEC Portal</title>
        </head>

        <body
          style="
            margin:0;
            padding:24px;
            background:#f8fafc;
            font-family:Arial,Helvetica,sans-serif;
            color:#0f172a;
          "
        >
          <div
            style="
              max-width:760px;
              margin:0 auto;
              padding:24px;
              background:#ffffff;
              border:1px solid #e5e7eb;
              border-radius:10px;
            "
          >
            <h2 style="margin:0 0 12px;font-size:22px;color:#0f172a;">
              Generated Reports
            </h2>

            <p style="margin:0 0 20px;color:#475569;font-size:14px;">
              The selected generated reports are attached to this email as PDF
              files.
            </p>

            ${reportListHtml}

            <hr
              style="
                border:none;
                border-top:1px solid #e5e7eb;
                margin:22px 0;
              "
            />

            <p style="margin:0;font-size:12px;color:#64748b;">
              Sent from STEC Portal.
            </p>
          </div>
        </body>
      </html>
    `;

    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "STEC Portal <onboarding@resend.dev>",
      to: validRecipients,
      subject: "Generated Reports from STEC Portal",
      html,
      attachments,
    });

    if (error) {
      console.error("[Vercel API] Resend error:", error);

      return res.status(500).json({
        error:
          typeof error === "object" && error !== null
            ? error
            : String(error),
      });
    }

    return res.status(200).json({
      success: true,
      attachmentCount: attachments.length,
      data,
    });
  } catch (error) {
    console.error(
      "[Vercel API] Send generated reports error:",
      error
    );

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
}