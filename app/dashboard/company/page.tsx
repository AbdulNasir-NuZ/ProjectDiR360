"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyForm } from "@/components/onboarding/company-form";
import { useDashboardState } from "@/components/onboarding/use-dashboard-state";
import { getAuthToken } from "@/lib/auth";

export default function CompanyPage() {
  const { state, refresh } = useDashboardState();
  const token = getAuthToken();

  if (state.kycStatus !== "approved") {
    return (
      <Card>
        <CardHeader><CardTitle>Company Creation Locked</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Complete KYC approval before creating a company profile.
        </CardContent>
      </Card>
    );
  }

  return token ? <CompanyForm token={token} onCreated={refresh} /> : null;
}
