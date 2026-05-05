import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const redirect = request.nextUrl.searchParams.get("redirect") ?? `${request.nextUrl.origin}/auth/callback`;

  // Placeholder OAuth flow: keep route alive and return a clear error to UI.
  const callback = new URL(redirect);
  callback.searchParams.set("error", "Google auth is not configured yet.");

  return NextResponse.redirect(callback);
}
