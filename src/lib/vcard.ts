/**
 * Generate a vCard 3.0 string from profile data
 */
export interface VCardData {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  handle?: string | null;
  avatarUrl?: string | null;
  profession?: string | null;
}

export function generateVCard(data: VCardData): string {
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
  ];

  if (data.name) {
    const parts = data.name.split(" ");
    const last = parts.length > 1 ? parts.pop()! : "";
    const first = parts.join(" ");
    lines.push(`N:${last};${first};;;`);
    lines.push(`FN:${data.name}`);
  }

  if (data.company) lines.push(`ORG:${data.company}`);
  if (data.profession) lines.push(`TITLE:${data.profession}`);
  if (data.email) lines.push(`EMAIL;TYPE=INTERNET:${data.email}`);
  if (data.phone) lines.push(`TEL;TYPE=CELL:${data.phone}`);

  if (data.handle) {
    const cardUrl = `${window.location.origin}/${data.handle}`;
    lines.push(`URL:${cardUrl}`);
  }

  lines.push(`PRODID:-//CardPilot//EN`);
  lines.push("END:VCARD");

  return lines.join("\r\n");
}

export function downloadVCard(data: VCardData) {
  const vcard = generateVCard(data);
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(data.name || "contact").replace(/\s+/g, "-").toLowerCase()}.vcf`;
  link.click();
  URL.revokeObjectURL(url);
}
