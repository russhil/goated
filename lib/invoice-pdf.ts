// Invoice PDF builder — the single source of truth for the GT-numbered invoice
// PDF. Extracted from app/admin/hq/invoice/[id]/route.ts so both that route and
// the Telegram bot (app/api/telegram) render the exact same document.

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type InvoiceRow = {
  invoice_no: string;
  client_name: string;
  client_address: string | null;
  description: string;
  amount: number;
  currency: string;
  issue_date: string;
};

function plain2(n: number): string {
  return (Number(n) || 0).toFixed(2);
}
function grouped(n: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}
function symbol(currency: string): string {
  return currency === "INR" ? "Rs. " : `${currency} `;
}
function fmtDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso || "";
}
// pdf-lib's standard Helvetica only encodes WinAnsi. Map the common offenders
// and drop anything else so a stray glyph never 500s the invoice.
function enc(s: string): string {
  return (s ?? "")
    .replace(/₹/g, "Rs. ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\x00-\xFF]/g, "?");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = (text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function buildInvoicePdf(inv: InvoiceRow): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page: PDFPage = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const light = rgb(0.85, 0.85, 0.85);
  const white = rgb(1, 1, 1);

  const ML = 57;
  const MR = width - 57;

  const at = (s: string, x: number, y: number, size: number, f = font, color = black) =>
    page.drawText(enc(s), { x, y, size, font: f, color });
  const right = (s: string, xRight: number, y: number, size: number, f = font, color = black) => {
    const t = enc(s);
    page.drawText(t, { x: xRight - f.widthOfTextAtSize(t, size), y, size, font: f, color });
  };
  const hline = (y: number, x1 = ML, x2 = MR, color = light) =>
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.5, color });

  // Top + bottom black bars.
  page.drawRectangle({ x: 0, y: height - 42, width, height: 42, color: black });
  page.drawRectangle({ x: 0, y: 0, width, height: 42, color: black });

  // Header
  at("INVOICE", ML, height - 128, 34, font, gray);
  at("Goated Software", MR - 118, height - 108, 11, font, black);
  let iy = height - 152;
  for (const line of ["Russhil Chawla", "Mulund (W), Mumbai - 400080", "Tel: +91 9324382801", "Pan Number: DGWPC7231J"]) {
    at(line, ML, iy, 9, font, gray);
    iy -= 14;
  }

  // Bill-to / date
  let by = height - 250;
  hline(by + 16);
  at("BILL TO", ML, by, 9, bold);
  right(`DATE ${fmtDate(inv.issue_date)}`, MR, by, 9, bold);
  by -= 15;
  hline(by + 16);
  at(inv.client_name, ML, by, 9, font);
  right(`INVOICE NO. ${inv.invoice_no}`, MR, by, 9, bold);
  by -= 13;
  for (const line of wrap(inv.client_address || "", font, 8, MR - ML - 160)) {
    at(line, ML, by, 8, font, gray);
    by -= 11;
  }

  // Table
  const cUnit = 452;
  const cTotal = MR;
  const cQty = 320;
  let ty = height - 380;
  page.drawRectangle({ x: ML, y: ty - 5, width: MR - ML, height: 20, color: black });
  at("DESCRIPTION", ML + 8, ty, 9, bold, white);
  at("QTY", cQty, ty, 9, bold, white);
  right("UNIT PRICE", cUnit, ty, 9, bold, white);
  right("TOTAL", cTotal - 4, ty, 9, bold, white);
  ty -= 25;

  const amt = plain2(inv.amount);
  const rows: { d: string; q: string; u: string; t: string }[] = [
    { d: inv.description, q: "1", u: amt, t: amt },
  ];
  for (let i = 0; i < 8; i++) rows.push({ d: "", q: "", u: "", t: "0.00" });
  for (const r of rows) {
    if (r.d) at(r.d, ML + 8, ty, 8.5, font, black);
    if (r.q) at(r.q, cQty + 4, ty, 8.5, font, black);
    if (r.u) right(r.u, cUnit, ty, 8.5, font, black);
    right(r.t, cTotal - 4, ty, 8.5, font, black);
    hline(ty - 7);
    ty -= 20;
  }

  // Totals
  at("Remarks / Payment Instructions:", ML, ty - 6, 8, font, gray);
  let sy = ty - 6;
  const totalRow = (l: string, v: string) => {
    right(l, cUnit, sy, 9, bold);
    right(v, cTotal - 4, sy, 9, font);
    sy -= 16;
  };
  totalRow("SUBTOTAL", plain2(inv.amount));
  totalRow("DISCOUNT", "0.00");
  totalRow("SUBTOTAL LESS DISCOUNT", plain2(inv.amount));
  totalRow("TAX RATE", "0.00%");
  totalRow("TOTAL TAX", "0.00");
  totalRow("SHIPPING/HANDLING", "0.00");

  // Balance due — anchor the label just left of the amount so they never collide.
  sy -= 10;
  const balStr = `${symbol(inv.currency)}${grouped(inv.amount)}`;
  const balW = bold.widthOfTextAtSize(enc(balStr), 15);
  hline(sy + 22, MR - balW - 200, MR);
  right("Balance Due", MR - balW - 18, sy, 15, bold);
  right(balStr, cTotal - 4, sy, 15, bold);

  // Bank details
  let ky = 156;
  for (const line of [
    "Bank Details:",
    "Account name: Russhil Chawla",
    "Account Number - 923010042882656",
    "IFSC: UTIB0004889",
    "Bank : AXIS bank",
  ]) {
    at(line, ML, ky, 8.5, font, black);
    ky -= 13;
  }

  return doc.save();
}
