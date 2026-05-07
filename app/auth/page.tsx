"use client";

import { FormEvent, ReactNode, Suspense, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { setAuth } from "@/lib/auth";

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageShell />}>
      <AuthPageClient />
    </Suspense>
  );
}

function AuthPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryMode = searchParams.get("mode");
  const initialMode = queryMode === "signup" || queryMode === "login" ? queryMode : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (mode === "login" ? "Welcome back" : "Create account"), [mode]);
  const isLogin = mode === "login";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      if (mode === "signup") {
        await api.signup({ email: trimmedEmail, password: trimmedPassword });
      }

      const auth = await api.login({ email: trimmedEmail, password: trimmedPassword });

      setAuth(auth.accessToken, {
        id: auth.user.id,
        email: auth.user.email,
      });

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  const continueWithDemo = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      const auth = await api.loginDemo();
      setAuth(auth.accessToken, {
        id: auth.user.id,
        email: auth.user.email,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <AuthPageShell isLogin={isLogin}>
      <Card className="mx-auto w-full max-w-md border-white/10 bg-black/60 backdrop-blur-md lg:ml-auto">
        <CardHeader>
          <CardTitle className="text-white">{title}</CardTitle>
          <CardDescription className="text-zinc-400">
            Sign in with your email or use the demo account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button variant={mode === "login" ? "default" : "outline"} onClick={() => setMode("login")}>
              Login
            </Button>
            <Button variant={mode === "signup" ? "default" : "outline"} onClick={() => setMode("signup")}>
              Sign up
            </Button>
          </div>

          <form className="space-y-3" onSubmit={submit}>
            <Input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            {mode === "signup" && (
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button className="w-full" type="submit" disabled={loading || demoLoading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              {mode === "login" ? "Login" : "Create account"}
            </Button>
          </form>

          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-zinc-500">
              <span className="h-px flex-1 bg-white/10" />
              or
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={continueWithDemo}
              disabled={loading || demoLoading}
            >
              {demoLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Use demo account
            </Button>
            <p className="text-center text-xs text-zinc-500">
              Connect a wallet from the dashboard after signing in.
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}

function AuthPageShell({ children, isLogin = true }: { children?: ReactNode; isLogin?: boolean }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#03070d]">
      <div className="pointer-events-none absolute inset-0 opacity-35">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-6 py-10 lg:grid-cols-2">
        <div className="relative hidden min-h-[640px] overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-10 lg:block">
          <div className="absolute inset-0">
            <Image
              src="/images/audit.jpg"
              alt="Sign in visual"
              fill
              className={`object-cover transition-all duration-500 ${isLogin ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
              priority
            />
            <Image
              src="/images/encrypted.jpg"
              alt="Sign up visual"
              fill
              className={`object-cover transition-all duration-500 ${isLogin ? "scale-105 opacity-0" : "scale-100 opacity-100"}`}
              priority
            />
            <div className="absolute inset-0 bg-black/65" />
          </div>

          <div className="relative z-10">
            <p className="mb-4 text-xs uppercase tracking-widest text-[#bda87a]">Digital Identity Layer</p>
            <h1 className="font-display text-5xl leading-[1] text-white">
              Secure onboarding for verifiable companies.
            </h1>
            <p className="mt-6 max-w-md text-zinc-300">
              Connect identity, compliance, and ownership in one continuous Web3-native flow.
            </p>
          </div>

          <div className="absolute bottom-10 left-10 right-10 z-10 grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-12 rounded-md border border-white/10 bg-black/25 backdrop-blur-sm" />
            ))}
          </div>
        </div>

        {children ?? (
          <Card className="mx-auto w-full max-w-md border-white/10 bg-black/60 backdrop-blur-md lg:ml-auto">
            <CardHeader>
              <CardTitle className="text-white">Welcome back</CardTitle>
              <CardDescription className="text-zinc-400">
                Sign in with your email or use the demo account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[420px] animate-pulse rounded-md bg-white/5" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
