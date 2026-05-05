"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { clearAuth } from "@/lib/auth";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/kyc", label: "KYC" },
  { href: "/dashboard/company", label: "Company" },
  { href: "/dashboard/nft", label: "NFT" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl gap-6 p-6 lg:p-10">
        <aside className="w-64 shrink-0 rounded-xl border border-border bg-card/70 p-4">
          <p className="mb-4 text-xs uppercase tracking-wide text-muted-foreground">Workspace</p>
          <nav className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  pathname === item.href ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Button
            variant="outline"
            className="mt-6 w-full"
            onClick={() => {
              clearAuth();
              router.push("/auth");
            }}
          >
            Logout
          </Button>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
