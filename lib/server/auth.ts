import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { db, ensureSchema } from "@/lib/server/db";

const JWT_SECRET = process.env.JWT_SECRET ?? "dire-local-secret";

export type AuthUser = {
  id: number;
  email: string | null;
  walletAddress: string | null;
};

export function signToken(user: AuthUser) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      walletAddress: user.walletAddress,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export async function requireUser(request: NextRequest): Promise<AuthUser> {
  await ensureSchema();
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = header.slice("Bearer ".length);
  const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  const userId = Number(payload.sub);
  if (!Number.isFinite(userId)) {
    throw new Error("Unauthorized");
  }

  const result = await db.query<{
    id: number;
    email: string | null;
    wallet_address: string | null;
  }>(
    `SELECT id, email, wallet_address
     FROM users
     WHERE id = $1`,
    [userId],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Unauthorized");
  }

  return {
    id: row.id,
    email: row.email,
    walletAddress: row.wallet_address,
  };
}
