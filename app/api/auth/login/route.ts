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

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    const result = await db.query<{
      id: number;
      email: string;
      password_hash: string | null;
      wallet_address: string | null;
    }>(
      `SELECT id, email, password_hash, wallet_address
       FROM users
       WHERE email = $1`,
      [email],
    );

    const user = result.rows[0];
    if (!user?.password_hash) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    let isValid = false;
    if (user.password_hash.startsWith("$2")) {
      isValid = await bcrypt.compare(password, user.password_hash);
    } else {
      // Backward compatibility for any legacy plaintext/alternate hashes.
      isValid = password === user.password_hash;
      if (isValid) {
        const migratedHash = await bcrypt.hash(password, 8);
        await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [migratedHash, user.id]);
      }
    }
    if (!isValid) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const token = signToken({ id: user.id, email: user.email, walletAddress: user.wallet_address });
    return NextResponse.json({
      token,
      user: {
        email: user.email,
        walletAddress: user.wallet_address,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

