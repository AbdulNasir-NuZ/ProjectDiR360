"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setAuth } from "@/lib/auth";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");
    const email = searchParams.get("email") ?? "google-user@local";
    const walletAddress = searchParams.get("walletAddress") ?? undefined;

    if (token) {
      setAuth(token, { email, walletAddress });
      router.replace("/dashboard");
      return;
    }

    if (error) {
      router.replace(`/auth?error=${encodeURIComponent(error)}`);
      return;
    }

    router.replace("/auth");
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Completing login...
      </div>
    </div>
  );
}
