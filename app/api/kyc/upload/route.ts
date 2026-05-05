import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const form = await request.formData();

    const fullName = String(form.get("fullName") ?? "").trim();
    const country = String(form.get("country") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const idType = String(form.get("idType") ?? "").trim();
    const idNumber = String(form.get("idNumber") ?? "").trim();
    const document = form.get("document");

    if (!fullName || !country || !phone || !idType || !idNumber || !(document instanceof File)) {
      return NextResponse.json({ message: "Invalid KYC payload." }, { status: 400 });
    }

    const status = "approved";

    await db.query(
      `INSERT INTO kyc_submissions
        (user_id, status, full_name, country, phone, id_type, id_number, document_name, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         status = EXCLUDED.status,
         full_name = EXCLUDED.full_name,
         country = EXCLUDED.country,
         phone = EXCLUDED.phone,
         id_type = EXCLUDED.id_type,
         id_number = EXCLUDED.id_number,
         document_name = EXCLUDED.document_name,
         updated_at = NOW()`,
      [user.id, status, fullName, country, phone, idType, idNumber, document.name],
    );

    await db.query("UPDATE users SET full_name = $1 WHERE id = $2", [fullName, user.id]);

    return NextResponse.json({ status });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
