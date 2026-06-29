import { google } from "googleapis";

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

type SuccessfulDelivery = {
  recipient: string;
  messageId: string | null;
  threadId: string | null;
};

type FailedDelivery = {
  recipient: string;
  error: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeFilename(value: unknown): string {
  const cleaned = String(value || "generated-report")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "");

  return cleaned || "generated-report";
}

function normalizeRecipients(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((recipient) =>
          String(recipient || "")
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    )
  );
}

function errorToString(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const possibleGoogleError = error as {
      response?: {
        data?: {
          error?: {
            message?: string;
          };
          message?: string;
        };
      };
      errors?: Array<{ message?: string }>;
      message?: string;
    };

    const googleMessage =
      possibleGoogleError.response?.data?.error?.message ||
      possibleGoogleError.response?.data?.message ||
      possibleGoogleError.errors?.[0]?.message ||
      possibleGoogleError.message;

    if (googleMessage) {
      return googleMessage;
    }
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown Gmail API error.";
  }
}

function encodeMimeHeader(value: string): string {
  const normalized = value.replace(/[\r\n]+/g, " ").trim();

  if (/^[\x20-\x7E]*$/.test(normalized)) {
    return normalized;
  }

  return `=?UTF-8?B?${Buffer.from(normalized, "utf8").toString("base64")}?=`;
}

function foldBase64(value: string): string {
  return value.match(/.{1,76}/g)?.join("\r\n") || "";
}

function cleanBase64(value: string): string {
  const trimmed = value.trim();

  // Allows either plain base64 or a data URL such as:
  // data:application/pdf;base64,JVBERi0x...
  const commaIndex = trimmed.indexOf(",");

  if (
    trimmed.toLowerCase().startsWith("data:") &&
    commaIndex !== -1
  ) {
    return trimmed.slice(commaIndex + 1).replace(/\s/g, "");
  }

  return trimmed.replace(/\s/g, "");
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createMimeMessage(options: {
  fromName: string;
  fromEmail: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  attachments: EmailAttachment[];
}): string {
  const {
    fromName,
    fromEmail,
    to,
    replyTo,
    subject,
    html,
    attachments,
  } = options;

  const mixedBoundary = `mixed_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;

  const alternativeBoundary = `alternative_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;

  const lines: string[] = [];

  lines.push(
    `From: ${encodeMimeHeader(fromName)} <${fromEmail}>`,
    `To: ${to}`,
    `Subject: ${encodeMimeHeader(subject)}`,
    "MIME-Version: 1.0"
  );

  if (replyTo) {
    lines.push(`Reply-To: ${replyTo}`);
  }

  lines.push(
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    "",
    `--${mixedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
    "",
    `--${alternativeBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    foldBase64(
      Buffer.from(
        "The selected report PDF is attached to this email.",
        "utf8"
      ).toString("base64")
    ),
    "",
    `--${alternativeBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    foldBase64(Buffer.from(html, "utf8").toString("base64")),
    "",
    `--${alternativeBoundary}--`
  );

  attachments.forEach((attachment) => {
    const safeFilename = sanitizeFilename(attachment.filename);
    const encodedFilename = encodeMimeHeader(safeFilename);
    const attachmentBase64 = cleanBase64(attachment.content);

    lines.push(
      "",
      `--${mixedBoundary}`,
      `Content-Type: application/pdf; name="${encodedFilename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${encodedFilename}"`,
      "",
      foldBase64(attachmentBase64)
    );
  });

  lines.push("", `--${mixedBoundary}--`, "");

  return lines.join("\r\n");
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed.",
    });
  }

  try {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
    const senderEmail = process.env.GMAIL_SENDER_EMAIL;
    const senderName =
      process.env.GMAIL_SENDER_NAME?.trim() || "STEC Portal";
    const replyTo = process.env.EMAIL_REPLY_TO?.trim();

    const missingVariables: string[] = [];

    if (!clientId) {
      missingVariables.push("GMAIL_CLIENT_ID");
    }

    if (!clientSecret) {
      missingVariables.push("GMAIL_CLIENT_SECRET");
    }

    if (!refreshToken) {
      missingVariables.push("GMAIL_REFRESH_TOKEN");
    }

    if (!senderEmail) {
      missingVariables.push("GMAIL_SENDER_EMAIL");
    }

    if (missingVariables.length > 0) {
      return res.status(500).json({
        error: `Missing Vercel environment variable${
          missingVariables.length > 1 ? "s" : ""
        }: ${missingVariables.join(", ")}`,
      });
    }

    if (!EMAIL_PATTERN.test(senderEmail as string)) {
      return res.status(500).json({
        error: "GMAIL_SENDER_EMAIL is not a valid email address.",
      });
    }

    if (replyTo && !EMAIL_PATTERN.test(replyTo)) {
      return res.status(500).json({
        error: "EMAIL_REPLY_TO is not a valid email address.",
      });
    }

    const { recipients, reports, subject, message } = req.body || {};

    const normalizedRecipients = normalizeRecipients(recipients);

    const invalidRecipients = normalizedRecipients.filter(
      (recipient) => !EMAIL_PATTERN.test(recipient)
    );

    if (normalizedRecipients.length === 0) {
      return res.status(400).json({
        error: "No recipient email address was provided.",
      });
    }

    if (invalidRecipients.length > 0) {
      return res.status(400).json({
        error: `Invalid recipient email address${
          invalidRecipients.length > 1 ? "es" : ""
        }: ${invalidRecipients.join(", ")}`,
        invalidRecipients,
      });
    }

    if (!Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({
        error: "No reports were provided.",
      });
    }

    const validReports = reports as GeneratedReportPayload[];

    const reportsWithPdf = validReports.filter(
      (report) =>
        typeof report.pdfBase64 === "string" &&
        report.pdfBase64.trim().length > 0
    );

    const attachments: EmailAttachment[] = reportsWithPdf.map(
      (report, index) => {
        const baseName = sanitizeFilename(
          report.filename ||
            report.title ||
            `generated-report-${index + 1}`
        );

        return {
          filename: baseName.toLowerCase().endsWith(".pdf")
            ? baseName
            : `${baseName}.pdf`,
          content: report.pdfBase64 as string,
        };
      }
    );

    if (attachments.length === 0) {
      return res.status(400).json({
        error:
          "No valid PDF attachment was received by the email API.",
      });
    }

    const reportListHtml = reportsWithPdf
      .map((report, index) => {
        const attachment = attachments[index];

        return `
          <div
            style="
              margin-bottom:14px;
              padding:12px;
              border:1px solid #e5e7eb;
              border-radius:8px;
            "
          >
            <strong>
              ${index + 1}. ${escapeHtml(
          report.title || "Generated Report"
        )}
            </strong>

            <br />

            <span
              style="
                font-size:13px;
                color:#475569;
                line-height:1.6;
              "
            >
              Project: ${escapeHtml(report.projectName || "-")}<br />
              Module: ${escapeHtml(report.moduleName || "-")}<br />
              Page: ${escapeHtml(report.pageName || "-")}<br />
              Attachment: ${escapeHtml(
                attachment?.filename || "report.pdf"
              )}
            </span>
          </div>
        `;
      })
      .join("");

    const customMessage = String(message || "").trim();

    const html = `
      <!doctype html>
      <html>
        <body
          style="
            margin:0;
            padding:24px;
            background:#f8fafc;
            font-family:Arial,sans-serif;
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
            <h2 style="margin:0 0 12px;">
              Generated Report${
                reportsWithPdf.length > 1 ? "s" : ""
              }
            </h2>

            ${
              customMessage
                ? `
                  <p
                    style="
                      white-space:pre-wrap;
                      color:#334155;
                      line-height:1.6;
                    "
                  >
                    ${escapeHtml(customMessage)}
                  </p>
                `
                : ""
            }

            <p style="color:#475569;">
              The selected report PDF${
                attachments.length > 1 ? "s are" : " is"
              } attached.
            </p>

            ${reportListHtml}

            <p
              style="
                font-size:12px;
                color:#64748b;
                margin-top:20px;
              "
            >
              Sent from STEC Portal.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailSubject =
      String(subject || "Generated Report from STEC Portal").trim() ||
      "Generated Report from STEC Portal";

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    /*
     * A separate email is sent to every recipient.
     * This keeps recipient addresses private and supports
     * per-recipient success and failure reporting.
     */
    const settled = await Promise.allSettled(
      normalizedRecipients.map(async (recipient) => {
        const mimeMessage = createMimeMessage({
          fromName: senderName,
          fromEmail: senderEmail as string,
          to: recipient,
          replyTo,
          subject: emailSubject,
          html,
          attachments,
        });

        const response = await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodeBase64Url(mimeMessage),
          },
        });

        return {
          recipient,
          messageId: response.data.id || null,
          threadId: response.data.threadId || null,
        } satisfies SuccessfulDelivery;
      })
    );

    const successes: SuccessfulDelivery[] = [];
    const failures: FailedDelivery[] = [];

    settled.forEach((result, index) => {
      const recipient = normalizedRecipients[index];

      if (result.status === "fulfilled") {
        successes.push(result.value);
      } else {
        failures.push({
          recipient,
          error: errorToString(result.reason),
        });
      }
    });

    const allFailed =
      successes.length === 0 && failures.length > 0;

    const partiallySuccessful =
      successes.length > 0 && failures.length > 0;

    return res.status(allFailed ? 502 : 200).json({
      success: failures.length === 0,
      partialSuccess: partiallySuccessful,
      successCount: successes.length,
      failureCount: failures.length,
      messageIds: successes,
      failures,
      attachmentCount: attachments.length,
      deliveryMode: "separate_email_per_recipient",
      provider: "gmail_api",
      message:
        failures.length === 0
          ? `Report sent successfully to ${successes.length} recipient${
              successes.length === 1 ? "" : "s"
            }.`
          : partiallySuccessful
          ? `Report sent to ${successes.length} recipient${
              successes.length === 1 ? "" : "s"
            }, but failed for ${failures.length}.`
          : "The report could not be sent to any recipient.",
    });
  } catch (error) {
    const errorMessage = errorToString(error);

    console.error(
      "[Vercel API] Gmail report sending error:",
      error
    );

    return res.status(500).json({
      error: errorMessage,
      provider: "gmail_api",
    });
  }
}