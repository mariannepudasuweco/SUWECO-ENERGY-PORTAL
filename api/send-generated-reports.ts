declare const process: {
  env: {
    RESEND_API_KEY?: string;
  };
};

import { Resend } from "resend";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

    const resend = new Resend(resendApiKey);

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

    const reportListHtml = reports
      .map((report: any, index: number) => {
        return `
          <div style="margin-bottom:16px;padding:12px;border:1px solid #e5e7eb;border-radius:8px;">
            <h3 style="margin:0 0 6px;font-size:16px;">
              ${index + 1}. ${escapeHtml(report.title || "Generated Report")}
            </h3>

            <p style="margin:0;color:#475569;font-size:13px;line-height:1.5;">
              Project: ${escapeHtml(report.projectName || "-")}<br/>
              Module: ${escapeHtml(report.moduleName || "-")}<br/>
              Page: ${escapeHtml(report.pageName || "-")}<br/>
              Scope: ${escapeHtml(report.scope || "-")}<br/>
              Generated: ${escapeHtml(report.generatedAt || "-")}
            </p>
          </div>
        `;
      })
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;color:#0f172a;">
        <h2 style="margin:0 0 12px;">Generated Reports</h2>
        <p style="margin:0 0 18px;color:#475569;">
          Please see the selected generated reports below.
        </p>

        ${reportListHtml}

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />

        <p style="font-size:12px;color:#64748b;">
          Sent from STEC Portal.
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "STEC Portal <onboarding@resend.dev>",
      to: recipients,
      subject: "Generated Reports from STEC Portal",
      html,
    });

    if (error) {
      console.error("[Vercel API] Resend error:", error);

      return res.status(500).json({
        error,
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[Vercel API] Send generated reports error:", error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}