"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyForm } from "@/components/onboarding/company-form";
import { useDashboardState } from "@/components/onboarding/use-dashboard-state";
import { getAuthToken } from "@/lib/auth";

export default function CompanyPage() {
  const { state, refresh } = useDashboardState();
  const token = getAuthToken();
  const [showForm, setShowForm] = useState(false);

  if (state.kycStatus !== "approved") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Creation Locked</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Complete KYC approval before creating a company profile.
        </CardContent>
      </Card>
    );
  }

  if (!token) return null;

  if (state.company && !showForm) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>{state.company.name}</span>
              <Badge variant="outline">{state.company.isLegal ? "Legal entity" : "Pre-Company"}</Badge>
            </CardTitle>
            <CardDescription>{state.company.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {state.company.industry && (
              <p>
                Industry: <span className="text-muted-foreground">{state.company.industry}</span>
              </p>
            )}
            {state.company.country && (
              <p>
                Country: <span className="text-muted-foreground">{state.company.country}</span>
              </p>
            )}
            {state.company.logoUrl && (
              <p>
                Logo: <span className="break-all font-mono text-xs text-muted-foreground">{state.company.logoUrl}</span>
              </p>
            )}
            {state.company.nftTokenId && (
              <p>
                NFT token id: <span className="font-mono text-muted-foreground">#{state.company.nftTokenId}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/nft">
              Continue to NFT mint <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setShowForm(true)}>
            Add another company
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CompanyForm
      token={token}
      onCreated={() => {
        setShowForm(false);
        void refresh();
      }}
    />
  );
}
