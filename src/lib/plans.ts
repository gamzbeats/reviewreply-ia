export const PLAN_LIMITS = {
  FREE: {
    analyzesPerMonth: 10,
    trendsPerMonth: 1,
    restaurants: 1,
    historyDays: 30,
    teamMembers: 1,
    competitors: 0,
    toneCustomization: false,
    templates: false,
    alerts: false,
    weeklyDigest: false,
    monthlyReport: false,
  },
  PRO: {
    analyzesPerMonth: -1, // unlimited
    trendsPerMonth: -1,
    restaurants: 1,
    historyDays: -1, // unlimited
    teamMembers: 1,
    competitors: 0,
    toneCustomization: true,
    templates: true,
    alerts: true,
    weeklyDigest: true,
    monthlyReport: false,
  },
  BUSINESS: {
    analyzesPerMonth: -1,
    trendsPerMonth: -1,
    restaurants: 10,
    historyDays: -1,
    teamMembers: 5,
    competitors: 5,
    toneCustomization: true,
    templates: true,
    alerts: true,
    weeklyDigest: true,
    monthlyReport: true,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as PlanType] || PLAN_LIMITS.FREE;
}
