import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getOrCreateUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getOrCreateUser();

    if (!user.stripeCustomerId) {
      return NextResponse.json({ invoices: [] });
    }

    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 24,
    });

    return NextResponse.json({
      invoices: invoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
        amount: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        pdfUrl: inv.invoice_pdf,
      })),
    });
  } catch (error) {
    logger.error("Invoices fetch error", error, { path: "/api/billing/invoices" });
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}
