import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/server/db";
import { signToken } from "@/lib/server/auth";

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const body = await request.json();
    const walletAddress = String(body?.walletAddress ?? "").trim();

    if (!walletAddress) {
      return NextResponse.json({ message: "Wallet address is required." }, { status: 400 });
    }

    let result = await db.query<{
      id: number;
      email: string | null;
      wallet_address: string;
    }>(
      `SELECT id, email, wallet_address
       FROM users
       WHERE wallet_address = $1`,
      [walletAddress],
    );

    if (!result.rowCount) {
      const inserted = await db.query<{
        id: number;
        email: string;
        wallet_address: string;
      }>(
        `INSERT INTO users (email, wallet_address)
         VALUES ($1, $2)
         RETURNING id, email, wallet_address`,
        [`${walletAddress.toLowerCase()}@wallet.local`, walletAddress],
      );
      result = inserted;
    }

    const user = result.rows[0];
    const token = signToken({ id: user.id, email: user.email, walletAddress: user.wallet_address });

    return NextResponse.json({
      token,
      user: {
        email: user.email,
        walletAddress: user.wallet_address,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wallet auth failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

