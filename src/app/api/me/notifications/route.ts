import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getOrCreateUser();

    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId: user.id },
      });
    }

    return NextResponse.json({
      emailNewReview: prefs.emailNewReview,
      emailNegativeOnly: prefs.emailNegativeOnly,
      emailWeeklyDigest: prefs.emailWeeklyDigest,
      emailMonthlyReport: prefs.emailMonthlyReport,
    });
  } catch (error) {
    logger.error("Notifications fetch error", error, { path: "/api/me/notifications" });
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const body = await request.json();

    const data: Record<string, boolean> = {};
    if (typeof body.emailNewReview === "boolean") data.emailNewReview = body.emailNewReview;
    if (typeof body.emailNegativeOnly === "boolean") data.emailNegativeOnly = body.emailNegativeOnly;
    if (typeof body.emailWeeklyDigest === "boolean") data.emailWeeklyDigest = body.emailWeeklyDigest;
    if (typeof body.emailMonthlyReport === "boolean") data.emailMonthlyReport = body.emailMonthlyReport;

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data },
    });

    return NextResponse.json({
      emailNewReview: prefs.emailNewReview,
      emailNegativeOnly: prefs.emailNegativeOnly,
      emailWeeklyDigest: prefs.emailWeeklyDigest,
      emailMonthlyReport: prefs.emailMonthlyReport,
    });
  } catch (error) {
    logger.error("Notifications update error", error, { path: "/api/me/notifications" });
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
