import type { EstimateSection, EstimateTotals } from "@/hooks/useEstimates";
import { showsBranding } from "@/lib/plans";
import { format } from "date-fns";

export function exportEstimatePDF({
  estimate,
  sections,
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
    terms_conditions?: string;
    discount_amount?: number;
    discount_percent?: number;
    deposit_percent?: number;
    deposit_amount?: number;
    leads?: { name?: string; email?: string; phone?: string; company?: string } | null;
  };
  sections: EstimateSection[];
  totals: EstimateTotals;
  profile?: { name?: string; company?: string; phone?: string; email?: string; avatar_url?: string } | null;
  planKey: string;
}) {
  const hasBranding = showsBranding(planKey);
  const contact = estimate.leads;
  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const sectionBlocks = sections.map((sec) => {
    const rows = sec.items
      .map(
        (li) => `
      <tr class="${li.is_optional ? 'optional' : ''}">
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;">
          <strong>${li.title}</strong>${li.is_optional ? ' <span style="color:#999;font-size:11px;">(Optional)</span>' : ""}
          ${li.description ? `<br/><span style="color:#888;font-size:12px;">${li.description}</span>` : ""}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${li.quantity} ${li.unit}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-size:13px;">${fmt(li.line_total)}</td>
      </tr>`
      )
      .join("");

    const sectionSubtotal = sec.items.reduce((sum, li) => sum + (li.is_optional ? 0 : li.line_total), 0);
    const showHeader = sections.length > 1 || sec.name !== "General";

    return `
      ${showHeader ? `<tr><td colspan="3" style="padding:14px 12px 6px;font-size:14px;font-weight:700;color:#333;border-bottom:1px solid #ddd;">${sec.name}${sec.notes ? `<br/><span style="font-weight:400;color:#888;font-size:12px;">${sec.notes}</span>` : ""}</td></tr>` : ""}
      ${rows}
      ${showHeader ? `<tr><td colspan="2" style="padding:6px 12px;font-size:12px;color:#888;text-align:right;">Section subtotal</td><td style="padding:6px 12px;text-align:right;font-size:12px;font-weight:600;">${fmt(sectionSubtotal)}</td></tr>` : ""}
    `;
  }).join("");

  const statusBadge = estimate.status === "approved"
    ? '<span style="background:#dcfce7;color:#15803d;padding:4px 12px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;">Approved</span>'
    : estimate.status === "declined"
    ? '<span style="background:#fef2f2;color:#dc2626;padding:4px 12px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;">Declined</span>'
    : "";

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
    tr.optional td { color:#888; font-style:italic; }
    .totals { width:280px; margin-left:auto; }
    .totals .row { display:flex; justify-content:space-between; padding:4px 0; font-size:13px; }
    .totals .row.muted { color:#888; }
    .totals .row.discount { color:#dc2626; }
    .totals .grand { border-top:2px solid #333; padding-top:8px; margin-top:4px; font-size:16px; font-weight:700; }
    .totals .deposit { border-top:1px solid #ddd; padding-top:6px; margin-top:6px; font-size:13px; color:#666; }
    .notes, .terms { margin-top:24px; padding:16px; background:#f8f8f8; border-radius:8px; }
    .notes h3, .terms h3 { font-size:13px; font-weight:600; margin-bottom:6px; }
    .notes p, .terms p { font-size:12px; color:#666; line-height:1.5; white-space:pre-wrap; }
    .watermark { text-align:center; margin-top:40px; padding-top:16px; border-top:1px solid #eee; font-size:11px; color:#bbb; }
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
      ${statusBadge ? `<p style="margin-top:6px;">${statusBadge}</p>` : ""}
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
      ${sectionBlocks}
    </tbody>
  </table>

  <div class="totals">
    <div class="row muted"><span>Subtotal</span><span>${fmt(totals.subtotal)}</span></div>
    ${totals.labor_total > 0 ? `<div class="row muted"><span>Labor</span><span>${fmt(totals.labor_total)}</span></div>` : ""}
    ${totals.material_total > 0 ? `<div class="row muted"><span>Materials</span><span>${fmt(totals.material_total)}</span></div>` : ""}
    ${totals.markup_total > 0 ? `<div class="row muted"><span>Markup</span><span>${fmt(totals.markup_total)}</span></div>` : ""}
    ${totals.discount_total > 0 ? `<div class="row discount"><span>Discount</span><span>-${fmt(totals.discount_total)}</span></div>` : ""}
    ${totals.tax_total > 0 ? `<div class="row muted"><span>Tax</span><span>${fmt(totals.tax_total)}</span></div>` : ""}
    <div class="row grand"><span>Grand Total</span><span>${fmt(totals.grand_total)}</span></div>
    ${totals.deposit_due > 0 ? `
      <div class="deposit">
        <div class="row"><span>Deposit Due</span><span>${fmt(totals.deposit_due)}</span></div>
        <div class="row"><span>Balance Due</span><span>${fmt(totals.balance_due)}</span></div>
      </div>
    ` : ""}
    ${totals.optional_total > 0 ? `<div class="row muted" style="margin-top:8px;font-style:italic;"><span>Optional items</span><span>${fmt(totals.optional_total)}</span></div>` : ""}
  </div>

  ${estimate.notes ? `<div class="notes"><h3>Notes</h3><p>${estimate.notes}</p></div>` : ""}
  ${estimate.terms_conditions ? `<div class="terms"><h3>Terms & Conditions</h3><p>${estimate.terms_conditions}</p></div>` : ""}

  ${hasBranding ? `<div class="watermark">Powered by CardPilot</div>` : ""}
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
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
