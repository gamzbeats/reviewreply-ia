import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getOrCreateUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getOrCreateUser();

    if (!user.stripeCustomerId) {
      return NextResponse.json({ subscription: null });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      limit: 1,
      status: "active",
    });

    const sub = subscriptions.data[0];
    if (!sub) {
      return NextResponse.json({ subscription: null });
    }

    // Use item-level period data
    const item = sub.items.data[0];
    const periodEnd = item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null;

    return NextResponse.json({
      subscription: {
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        plan: item?.price?.nickname || user.plan,
        amount: item?.price?.unit_amount || 0,
        currency: item?.price?.currency || "eur",
        interval: item?.price?.recurring?.interval || "month",
      },
    });
  } catch (error) {
    logger.error("Subscription fetch error", error, { path: "/api/billing/subscription" });
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}
