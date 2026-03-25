import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error("Stripe webhook signature error", err, { path: "/api/webhooks/stripe" });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId || !subscriptionId) break;

        // Get subscription details
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0]?.price.id;
        const item = sub.items.data[0];

        // Determine plan from price ID
        const plan =
          priceId === process.env.STRIPE_BUSINESS_PRICE_ID
            ? "BUSINESS"
            : "PRO";

        // Update user plan
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: plan as "PRO" | "BUSINESS",
            stripeCustomerId: customerId,
          },
        });

        // Store subscription
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: subscriptionId },
          create: {
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            stripePriceId: priceId,
            status: sub.status,
            currentPeriodStart: new Date(item.current_period_start * 1000),
            currentPeriodEnd: new Date(item.current_period_end * 1000),
          },
          update: {
            status: sub.status,
            stripePriceId: priceId,
            currentPeriodStart: new Date(item.current_period_start * 1000),
            currentPeriodEnd: new Date(item.current_period_end * 1000),
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price.id;
        const item = sub.items.data[0];

        const plan =
          priceId === process.env.STRIPE_BUSINESS_PRICE_ID
            ? "BUSINESS"
            : "PRO";

        // Update subscription record
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: sub.id },
          create: {
            stripeSubscriptionId: sub.id,
            stripeCustomerId: customerId,
            stripePriceId: priceId,
            status: sub.status,
            currentPeriodStart: new Date(item.current_period_start * 1000),
            currentPeriodEnd: new Date(item.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          update: {
            status: sub.status,
            stripePriceId: priceId,
            currentPeriodStart: new Date(item.current_period_start * 1000),
            currentPeriodEnd: new Date(item.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });

        // Update user plan if active
        if (sub.status === "active") {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { plan: plan as "PRO" | "BUSINESS" },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        // Downgrade to free
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan: "FREE" },
        });

        // Update subscription status
        await prisma.subscription
          .update({
            where: { stripeSubscriptionId: sub.id },
            data: { status: "canceled" },
          })
          .catch(() => {});
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        logger.error("Payment failed", null, {
          path: "/api/webhooks/stripe",
          customerId,
          invoiceId: invoice.id,
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Stripe webhook handler error", error, { path: "/api/webhooks/stripe" });
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
