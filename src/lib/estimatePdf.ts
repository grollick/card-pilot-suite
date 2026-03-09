import type { EstimateLineItem, EstimateTotals } from "@/hooks/useEstimates";
import { showsBranding } from "@/lib/plans";
import { format } from "date-fns";

/**
 * Generates an estimate as an HTML string, opens a print dialog for PDF export.
 * Free plan includes CardPilot watermark; premium plans are fully branded.
 */
export function exportEstimatePDF({
  estimate,
  lineItems,
  totals,
  profile,
  planKey,
}: {
  estimate: {
    estimate_number: string;
    issue_date: string;
    expiry_date?: string | null;
    job_address?: string;
    job_type?: string;
    scope_of_work?: string;
    notes?: string;
    status: string;
    leads?: { name?: string; email?: string; phone?: string; company?: string } | null;
  };
  lineItems: EstimateLineItem[];
  totals: EstimateTotals;
  profile?: { name?: string; company?: string; phone?: string; email?: string; avatar_url?: string } | null;
  planKey: string;
}) {
  const hasBranding = showsBranding(planKey);
  const contact = estimate.leads;
  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const lineItemRows = lineItems
    .map(
      (li) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;">
        <strong>${li.title}</strong>${li.description ? `<br/><span style="color:#888;font-size:12px;">${li.description}</span>` : ""}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${li.quantity} ${li.unit}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-size:13px;">${fmt(li.line_total)}</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Estimate ${estimate.estimate_number}</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; color:#1a1a1a; padding:40px; max-width:800px; margin:0 auto; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; }
    .company { font-size:20px; font-weight:700; }
    .company-details { font-size:12px; color:#666; margin-top:4px; }
    .estimate-meta { text-align:right; }
    .estimate-meta h1 { font-size:28px; font-weight:800; color:#333; letter-spacing:-0.5px; }
    .estimate-meta p { font-size:12px; color:#666; margin-top:2px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px; }
    .info-box { background:#f8f8f8; border-radius:8px; padding:16px; }
    .info-box h3 { font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#999; margin-bottom:6px; }
    .info-box p { font-size:13px; line-height:1.5; }
    .scope { margin-bottom:24px; }
    .scope h3 { font-size:13px; font-weight:600; margin-bottom:8px; }
    .scope p { font-size:13px; color:#555; line-height:1.6; white-space:pre-wrap; }
    table { width:100%; border-collapse:collapse; margin-bottom:24px; }
    thead th { padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#999; border-bottom:2px solid #e5e5e5; }
    thead th:last-child { text-align:right; }
    thead th:nth-child(2) { text-align:center; }
    .totals { width:260px; margin-left:auto; }
    .totals .row { display:flex; justify-content:space-between; padding:4px 0; font-size:13px; }
    .totals .row.muted { color:#888; }
    .totals .grand { border-top:2px solid #333; padding-top:8px; margin-top:4px; font-size:16px; font-weight:700; }
    .notes { margin-top:24px; padding:16px; background:#f8f8f8; border-radius:8px; }
    .notes h3 { font-size:13px; font-weight:600; margin-bottom:6px; }
    .notes p { font-size:12px; color:#666; line-height:1.5; white-space:pre-wrap; }
    .watermark { text-align:center; margin-top:40px; padding-top:16px; border-top:1px solid #eee; font-size:11px; color:#bbb; }
    .status-badge { display:inline-block; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
    @media print { body { padding:20px; } .watermark { position:fixed; bottom:20px; left:0; right:0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">${profile?.company || profile?.name || "Your Business"}</div>
      <div class="company-details">
        ${[profile?.phone, profile?.email].filter(Boolean).join(" · ")}
      </div>
    </div>
    <div class="estimate-meta">
      <h1>ESTIMATE</h1>
      <p><strong>${estimate.estimate_number}</strong></p>
      <p>Issued: ${estimate.issue_date ? format(new Date(estimate.issue_date + "T00:00:00"), "MMM d, yyyy") : "—"}</p>
      ${estimate.expiry_date ? `<p>Expires: ${format(new Date(estimate.expiry_date + "T00:00:00"), "MMM d, yyyy")}</p>` : ""}
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Customer</h3>
      <p>
        ${contact?.name || "—"}<br/>
        ${contact?.company ? contact.company + "<br/>" : ""}
        ${[contact?.email, contact?.phone].filter(Boolean).join("<br/>")}
      </p>
    </div>
    <div class="info-box">
      <h3>Job Details</h3>
      <p>
        ${estimate.job_type ? `<strong>${estimate.job_type}</strong><br/>` : ""}
        ${estimate.job_address || ""}
      </p>
    </div>
  </div>

  ${estimate.scope_of_work ? `<div class="scope"><h3>Scope of Work</h3><p>${estimate.scope_of_work}</p></div>` : ""}

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="row muted"><span>Subtotal</span><span>${fmt(totals.subtotal)}</span></div>
    ${totals.labor_total > 0 ? `<div class="row muted"><span>Labor</span><span>${fmt(totals.labor_total)}</span></div>` : ""}
    ${totals.material_total > 0 ? `<div class="row muted"><span>Materials</span><span>${fmt(totals.material_total)}</span></div>` : ""}
    ${totals.markup_total > 0 ? `<div class="row muted"><span>Markup</span><span>${fmt(totals.markup_total)}</span></div>` : ""}
    ${totals.tax_total > 0 ? `<div class="row muted"><span>Tax</span><span>${fmt(totals.tax_total)}</span></div>` : ""}
    <div class="row grand"><span>Grand Total</span><span>${fmt(totals.grand_total)}</span></div>
  </div>

  ${estimate.notes ? `<div class="notes"><h3>Notes</h3><p>${estimate.notes}</p></div>` : ""}

  ${hasBranding ? `<div class="watermark">Powered by CardPilot</div>` : ""}
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    // Fallback: download as HTML
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${estimate.estimate_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
}
