import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

interface WebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: { email_address: string }[];
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
  };
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  // If no webhook secret, accept events without verification (dev mode)
  if (!webhookSecret) {
    const body = await request.json();
    await handleEvent(body);
    return NextResponse.json({ received: true });
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing headers" }, { status: 400 });
  }

  const body = await request.text();

  try {
    const wh = new Webhook(webhookSecret);
    const event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;

    await handleEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Webhook verification failed", error, { path: "/api/webhooks/clerk" });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
}

async function handleEvent(event: WebhookEvent) {
  const { type, data } = event;

  if (type === "user.created" || type === "user.updated") {
    const email = data.email_addresses?.[0]?.email_address || "";
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

    if (type === "user.created") {
      await prisma.user.upsert({
        where: { clerkId: data.id },
        update: { email, name, avatarUrl: data.image_url },
        create: {
          clerkId: data.id,
          email,
          name,
          avatarUrl: data.image_url,
          restaurants: {
            create: { name: "Mon restaurant" },
          },
        },
      });
    } else {
      await prisma.user.updateMany({
        where: { clerkId: data.id },
        data: { email, name, avatarUrl: data.image_url },
      });
    }
  }

  if (type === "user.deleted") {
    await prisma.user.deleteMany({
      where: { clerkId: data.id },
    });
  }
}
