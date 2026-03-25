import { prisma } from "./db";
import type { TeamRole } from "@/generated/prisma/client";

const ROLE_HIERARCHY: Record<TeamRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

/**
 * Check if a user has access to a restaurant (as owner or team member).
 * Returns the user's role or null if no access.
 */
export async function checkTeamAccess(
  userId: string,
  restaurantId: string
): Promise<{ role: TeamRole; isOwner: boolean } | null> {
  // Check direct ownership first
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, ownerId: userId },
  });

  if (restaurant) {
    return { role: "OWNER", isOwner: true };
  }

  // Check team membership
  const membership = await prisma.teamMember.findUnique({
    where: {
      userId_restaurantId: { userId, restaurantId },
    },
  });

  if (membership) {
    return { role: membership.role, isOwner: false };
  }

  return null;
}

/**
 * Require a minimum role to perform an action.
 * Returns true if the user's role meets or exceeds the required level.
 */
export function hasMinRole(userRole: TeamRole, requiredRole: TeamRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Require team access with a minimum role. Throws if insufficient.
 */
export async function requireTeamRole(
  userId: string,
  restaurantId: string,
  minRole: TeamRole = "MEMBER"
): Promise<{ role: TeamRole; isOwner: boolean }> {
  const access = await checkTeamAccess(userId, restaurantId);

  if (!access) {
    throw new Error("NOT_FOUND");
  }

  if (!hasMinRole(access.role, minRole)) {
    throw new Error("FORBIDDEN");
  }

  return access;
}
