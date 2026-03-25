import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { requireTeamRole } from "@/lib/rbac";
import { parseBody } from "@/lib/api-helpers";
import { teamMemberUpdateSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string; memberId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { restaurantId, memberId } = await params;

    await requireTeamRole(user.id, restaurantId, "ADMIN");

    const parsed = await parseBody(request, teamMemberUpdateSchema);
    if ("error" in parsed) return parsed.error;

    const member = await prisma.teamMember.update({
      where: { id: memberId, restaurantId },
      data: { role: parsed.data.role === "ADMIN" ? "ADMIN" : "MEMBER" },
    });

    return NextResponse.json({ member });
  } catch (error) {
    if (error instanceof Error && ["FORBIDDEN", "NOT_FOUND"].includes(error.message)) {
      return NextResponse.json(
        { error: error.message === "FORBIDDEN" ? "Forbidden" : "Not found" },
        { status: error.message === "FORBIDDEN" ? 403 : 404 }
      );
    }
    logger.error("Team update error", error, { path: "/api/restaurants/[id]/team/[memberId]" });
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string; memberId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { restaurantId, memberId } = await params;

    await requireTeamRole(user.id, restaurantId, "ADMIN");

    await prisma.teamMember.delete({
      where: { id: memberId, restaurantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && ["FORBIDDEN", "NOT_FOUND"].includes(error.message)) {
      return NextResponse.json(
        { error: error.message === "FORBIDDEN" ? "Forbidden" : "Not found" },
        { status: error.message === "FORBIDDEN" ? 403 : 404 }
      );
    }
    logger.error("Team delete error", error, { path: "/api/restaurants/[id]/team/[memberId]" });
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
