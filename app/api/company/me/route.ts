import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const result = await db.query<{ name: string; description: string }>(
      "SELECT name, description FROM companies WHERE user_id = $1",
      [user.id],
    );

    return NextResponse.json({
      company: result.rows[0] ?? null,
    });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
