import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const description = String(body?.description ?? "").trim();

    if (!name || !description) {
      return NextResponse.json({ message: "Name and description are required." }, { status: 400 });
    }

    const kyc = await db.query<{ status: string }>("SELECT status FROM kyc_submissions WHERE user_id = $1", [user.id]);
    if (kyc.rows[0]?.status !== "approved") {
      return NextResponse.json({ message: "KYC must be approved before company creation." }, { status: 403 });
    }

    await db.query(
      `INSERT INTO companies (user_id, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
      [user.id, name, description],
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
