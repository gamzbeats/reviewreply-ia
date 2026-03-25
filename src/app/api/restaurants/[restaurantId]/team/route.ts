import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { requireTeamRole } from "@/lib/rbac";
import { parseBody } from "@/lib/api-helpers";
import { teamMemberInviteSchema } from "@/lib/validation";
import { getPlanLimits } from "@/lib/plans";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { restaurantId } = await params;

    await requireTeamRole(user.id, restaurantId, "MEMBER");

    const members = await prisma.teamMember.findMany({
      where: { restaurantId },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    });

    // Also include the owner
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { owner: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });

    return NextResponse.json({
      owner: restaurant?.owner,
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.user.email,
        name: m.user.name,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    logger.error("Team fetch error", error, { path: "/api/restaurants/[id]/team" });
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { restaurantId } = await params;

    // Only OWNER/ADMIN can invite
    await requireTeamRole(user.id, restaurantId, "ADMIN");

    // Check plan
    const limits = getPlanLimits(user.plan);
    if (limits.teamMembers <= 1) {
      return NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 403 });
    }

    const parsed = await parseBody(request, teamMemberInviteSchema);
    if ("error" in parsed) return parsed.error;

    const { email, role } = parsed.data;

    // Check team size limit
    const currentCount = await prisma.teamMember.count({ where: { restaurantId } });
    if (currentCount >= limits.teamMembers - 1) { // -1 because owner counts
      return NextResponse.json({ error: "TEAM_LIMIT" }, { status: 403 });
    }

    // Find user by email
    const invitedUser = await prisma.user.findUnique({ where: { email } });
    if (!invitedUser) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    // Check if already a member
    const existing = await prisma.teamMember.findUnique({
      where: { userId_restaurantId: { userId: invitedUser.id, restaurantId } },
    });
    if (existing) {
      return NextResponse.json({ error: "ALREADY_MEMBER" }, { status: 409 });
    }

    const member = await prisma.teamMember.create({
      data: {
        userId: invitedUser.id,
        restaurantId,
        role: role === "ADMIN" ? "ADMIN" : "MEMBER",
      },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });

    return NextResponse.json({
      member: {
        id: member.id,
        userId: member.userId,
        email: member.user.email,
        name: member.user.name,
        avatarUrl: member.user.avatarUrl,
        role: member.role,
        createdAt: member.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    logger.error("Team invite error", error, { path: "/api/restaurants/[id]/team" });
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 });
  }
}
