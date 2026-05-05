import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const result = await db.query<{ status: string }>(
      "SELECT status FROM nft_mints WHERE user_id = $1",
      [user.id],
    );

    return NextResponse.json({
      status: result.rows[0]?.status ?? "not_minted",
    });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
