import { prisma } from "./db";
import { getPlanLimits } from "./plans";
import type { UsageAction } from "@/generated/prisma/client";

export async function trackUsage(userId: string, action: UsageAction) {
  await prisma.usageRecord.create({
    data: { userId, action },
  });
}

export async function getMonthlyUsage(userId: string, action: UsageAction) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return prisma.usageRecord.count({
    where: {
      userId,
      action,
      createdAt: { gte: startOfMonth },
    },
  });
}

export async function checkLimit(
  userId: string,
  plan: string,
  action: UsageAction
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limits = getPlanLimits(plan);

  let limit: number;
  switch (action) {
    case "ANALYZE_REVIEW":
    case "REGENERATE_RESPONSE":
      limit = limits.analyzesPerMonth;
      break;
    case "TRENDS_ANALYSIS":
      limit = limits.trendsPerMonth;
      break;
    default:
      limit = -1;
  }

  // -1 = unlimited
  if (limit === -1) {
    return { allowed: true, used: 0, limit: -1 };
  }

  const used = await getMonthlyUsage(userId, action);

  return {
    allowed: used < limit,
    used,
    limit,
  };
}
