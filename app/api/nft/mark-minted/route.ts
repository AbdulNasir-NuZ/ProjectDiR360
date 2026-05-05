import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const tokenId = body?.tokenId ? String(body.tokenId) : null;

    await db.query(
      `INSERT INTO nft_mints (user_id, status, token_id, updated_at)
       VALUES ($1, 'minted', $2, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET status = 'minted', token_id = EXCLUDED.token_id, updated_at = NOW()`,
      [user.id, tokenId],
    );

    return NextResponse.json({ status: "minted" });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
