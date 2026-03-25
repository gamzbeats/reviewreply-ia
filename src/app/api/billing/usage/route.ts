import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { getMonthlyUsage } from "@/lib/usage";

export async function GET() {
  try {
    const user = await getOrCreateUser();

    const [analyzes, trends] = await Promise.all([
      getMonthlyUsage(user.id, "ANALYZE_REVIEW"),
      getMonthlyUsage(user.id, "TRENDS_ANALYSIS"),
    ]);

    return NextResponse.json({ analyzes, trends });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
