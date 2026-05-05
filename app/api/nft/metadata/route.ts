import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);

    const kyc = await db.query<{ status: string }>("SELECT status FROM kyc_submissions WHERE user_id = $1", [user.id]);
    if (kyc.rows[0]?.status !== "approved") {
      return NextResponse.json({ message: "KYC must be approved." }, { status: 403 });
    }

    const company = await db.query<{ name: string; description: string }>(
      "SELECT name, description FROM companies WHERE user_id = $1",
      [user.id],
    );

    if (!company.rowCount) {
      return NextResponse.json({ message: "Create company profile first." }, { status: 400 });
    }

    const metadataURI = `https://metadata.dire.local/company/${user.id}`;

    await db.query(
      `INSERT INTO nft_mints (user_id, status, metadata_uri, updated_at)
       VALUES ($1, 'not_minted', $2, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET metadata_uri = EXCLUDED.metadata_uri, updated_at = NOW()`,
      [user.id, metadataURI],
    );

    return NextResponse.json({ metadataURI });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
