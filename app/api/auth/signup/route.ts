import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/server/db";
import { signToken } from "@/lib/server/auth";

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "").trim();
    const walletAddress = body?.walletAddress ? String(body.walletAddress).trim() : null;

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 8);
    const created = await db.query<{
      id: number;
      email: string;
      wallet_address: string | null;
    }>(
      `INSERT INTO users (email, password_hash, wallet_address)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, wallet_address`,
      [email, passwordHash, walletAddress],
    );
    if (!created.rowCount) {
      return NextResponse.json({ message: "User already exists." }, { status: 409 });
    }

    const user = created.rows[0];
    const token = signToken({ id: user.id, email: user.email, walletAddress: user.wallet_address });

    return NextResponse.json({
      token,
      user: {
        email: user.email,
        walletAddress: user.wallet_address,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
