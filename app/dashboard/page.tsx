"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardState } from "@/components/onboarding/use-dashboard-state";

export default function DashboardPage() {
  const { state, loading } = useDashboardState();
  const kycApproved = state.kycStatus === "approved";

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>User</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Email: <span className="text-muted-foreground">{state.user?.email ?? "-"}</span></p>
            <p>Wallet: <span className="font-mono text-muted-foreground">{state.user?.walletAddress ?? "Not connected"}</span></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>KYC</span>
              <Badge variant="outline">{loading ? "loading" : state.kycStatus}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>NFT</span>
              <Badge variant="outline">{loading ? "loading" : state.nftStatus}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Button asChild><Link href="/dashboard/kyc">Complete KYC</Link></Button>
        <Button asChild variant="outline" disabled={!kycApproved}><Link href="/dashboard/company">Create Company</Link></Button>
        <Button asChild variant="outline" disabled={!kycApproved}><Link href="/dashboard/nft">Mint NFT</Link></Button>
      </div>

      {state.company && (
        <Card>
          <CardHeader><CardTitle>Company</CardTitle></CardHeader>
          <CardContent>
            <p className="font-medium">{state.company.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{state.company.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
