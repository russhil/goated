import { buildInvoicePdf, type InvoiceRow } from "@/lib/invoice-pdf";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireFinancials } from "../../guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireFinancials();
  if (!gate.ok) return new Response("forbidden", { status: 403 });

  const admin = createAdminClient();
  const { data: inv } = await admin
    .from("invoices")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!inv) return new Response("not found", { status: 404 });

  const row = inv as InvoiceRow;
  const bytes = await buildInvoicePdf(row);

  // Inline by default (so the preview card can render it); ?download=1 forces
  // the save-file dialog.
  const download = new URL(req.url).searchParams.has("download");
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="INV_${row.invoice_no}.pdf"`,
    },
  });
}
