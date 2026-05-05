"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NftMintCard } from "@/components/onboarding/nft-mint-card";
import { useDashboardState } from "@/components/onboarding/use-dashboard-state";
import { getAuthToken } from "@/lib/auth";

export default function NftPage() {
  const { state } = useDashboardState();
  const token = getAuthToken();

  if (state.kycStatus !== "approved") {
    return (
      <Card>
        <CardHeader><CardTitle>NFT Mint Locked</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          KYC must be approved before minting.
        </CardContent>
      </Card>
    );
  }

  return token ? <NftMintCard token={token} /> : null;
}
