"use client";

import { DashboardShell } from "@/components/onboarding/dashboard-shell";
import { RequireAuth } from "@/components/onboarding/require-auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}
