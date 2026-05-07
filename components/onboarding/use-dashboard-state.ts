"use client";

import { useCallback, useEffect, useState } from "react";
import { api, CompanyResponse, KycStatus, NftStatus } from "@/lib/api";
import { getAuthToken, getStoredUser, StoredUser } from "@/lib/auth";

export type DashboardState = {
  user: StoredUser | null;
  kycStatus: KycStatus;
  nftStatus: NftStatus;
  company: CompanyResponse | null;
};

function deriveNftStatus(company: CompanyResponse | null): NftStatus {
  if (!company) return "not_minted";
  if (company.nftTokenId) return "minted";
  if (company.status === "pending") return "pending";
  return "not_minted";
}

export function useDashboardState() {
  const [state, setState] = useState<DashboardState>({
    user: getStoredUser(),
    kycStatus: getStoredUser()?.kycStatus ?? "not_submitted",
    nftStatus: "not_minted",
    company: null,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const companies = await api.getMyCompanies(token).catch(() => [] as CompanyResponse[]);
      const company = companies[0] ?? null;
      const stored = getStoredUser();

      setState({
        user: stored,
        kycStatus: stored?.kycStatus ?? "not_submitted",
        nftStatus: deriveNftStatus(company),
        company,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, loading, refresh };
}
