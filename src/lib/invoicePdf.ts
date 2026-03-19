import { showsBranding } from "@/lib/plans";
import { format } from "date-fns";

interface InvoiceLineItem {
  title: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export function exportInvoicePDF({
  invoice,
  lineItems,
  profile,
  planKey,
}: {
  invoice: {
    invoice_number: string;
    issue_date: string;
    due_date?: string | null;
    status: string;
    subtotal: number;
    tax_total: number;
    discount_amount: number;
    grand_total: number;
    amount_paid: number;
    notes?: string | null;
    terms?: string | null;
    leads?: { name?: string; email?: string; phone?: string; company?: string } | null;
    jobs?: { title?: string; job_number?: string } | null;
  };
  lineItems: InvoiceLineItem[];
  profile?: { name?: string; company?: string; phone?: string; email?: string } | null;
  planKey: string;
}) {
  const hasBranding = showsBranding(planKey);
  const contact = invoice.leads;
  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const balanceDue = Number(invoice.grand_total) - Number(invoice.amount_paid || 0);

  const statusBadge = invoice.status === "paid"
    ? '<span style="background:#dcfce7;color:#15803d;padding:4px 12px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;">Paid</span>'
    : invoice.status === "overdue"
    ? '<span style="background:#fef2f2;color:#dc2626;padding:4px 12px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;">Overdue</span>'
    : invoice.status === "sent"
    ? '<span style="background:#eff6ff;color:#2563eb;padding:4px 12px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;">Sent</span>'
    : "";

  const rows = lineItems.map(li => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;">
        <strong>${li.title}</strong>
        ${li.description ? `<br/><span style="color:#888;font-size:12px;">${li.description}</span>` : ""}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${li.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-size:13px;">${fmt(li.unit_price)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-size:13px;">${fmt(li.line_total)}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; color:#1a1a1a; padding:40px; max-width:800px; margin:0 auto; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; }
    .company { font-size:20px; font-weight:700; }
    .company-details { font-size:12px; color:#666; margin-top:4px; }
    .invoice-meta { text-align:right; }
    .invoice-meta h1 { font-size:28px; font-weight:800; color:#333; letter-spacing:-0.5px; }
    .invoice-meta p { font-size:12px; color:#666; margin-top:2px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px; }
    .info-box { background:#f8f8f8; border-radius:8px; padding:16px; }
    .info-box h3 { font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#999; margin-bottom:6px; }
    .info-box p { font-size:13px; line-height:1.5; }
    table { width:100%; border-collapse:collapse; margin-bottom:24px; }
    thead th { padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#999; border-bottom:2px solid #e5e5e5; }
    thead th:last-child, thead th:nth-child(3) { text-align:right; }
    thead th:nth-child(2) { text-align:center; }
    .totals { width:280px; margin-left:auto; }
    .totals .row { display:flex; justify-content:space-between; padding:4px 0; font-size:13px; }
    .totals .row.muted { color:#888; }
    .totals .row.discount { color:#dc2626; }
    .totals .grand { border-top:2px solid #333; padding-top:8px; margin-top:4px; font-size:16px; font-weight:700; }
    .totals .paid { border-top:1px solid #ddd; padding-top:6px; margin-top:6px; font-size:13px; color:#15803d; }
    .totals .balance { font-size:14px; font-weight:600; color:#dc2626; margin-top:4px; }
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
    <div class="invoice-meta">
      <h1>INVOICE</h1>
      <p><strong>${invoice.invoice_number}</strong></p>
      <p>Issued: ${invoice.issue_date ? format(new Date(invoice.issue_date + "T00:00:00"), "MMM d, yyyy") : "—"}</p>
      ${invoice.due_date ? `<p>Due: ${format(new Date(invoice.due_date + "T00:00:00"), "MMM d, yyyy")}</p>` : ""}
      ${statusBadge ? `<p style="margin-top:6px;">${statusBadge}</p>` : ""}
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Bill To</h3>
      <p>
        ${contact?.name || "—"}<br/>
        ${contact?.company ? contact.company + "<br/>" : ""}
        ${[contact?.email, contact?.phone].filter(Boolean).join("<br/>")}
      </p>
    </div>
    ${invoice.jobs ? `
    <div class="info-box">
      <h3>Job Reference</h3>
      <p>
        <strong>${invoice.jobs.job_number || ""}</strong><br/>
        ${invoice.jobs.title || ""}
      </p>
    </div>` : `<div></div>`}
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="totals">
    <div class="row muted"><span>Subtotal</span><span>${fmt(invoice.subtotal)}</span></div>
    ${Number(invoice.tax_total) > 0 ? `<div class="row muted"><span>Tax</span><span>${fmt(invoice.tax_total)}</span></div>` : ""}
    ${Number(invoice.discount_amount) > 0 ? `<div class="row discount"><span>Discount</span><span>-${fmt(invoice.discount_amount)}</span></div>` : ""}
    <div class="row grand"><span>Total</span><span>${fmt(invoice.grand_total)}</span></div>
    ${Number(invoice.amount_paid) > 0 ? `<div class="paid"><div class="row"><span>Paid</span><span>${fmt(invoice.amount_paid)}</span></div></div>` : ""}
    ${balanceDue > 0 && balanceDue < Number(invoice.grand_total) ? `<div class="balance"><div class="row"><span>Balance Due</span><span>${fmt(balanceDue)}</span></div></div>` : ""}
  </div>

  ${invoice.notes ? `<div class="notes"><h3>Notes</h3><p>${invoice.notes}</p></div>` : ""}
  ${invoice.terms ? `<div class="terms"><h3>Terms & Conditions</h3><p>${invoice.terms}</p></div>` : ""}

  ${hasBranding ? `<div class="watermark">Powered by CardPilot</div>` : ""}
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoice_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
}