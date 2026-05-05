"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, KycStatus, NftStatus } from "@/lib/api";
import { getAuthToken, getStoredUser, StoredUser } from "@/lib/auth";

export type DashboardState = {
  user: StoredUser | null;
  kycStatus: KycStatus;
  nftStatus: NftStatus;
  company?: { name: string; description: string } | null;
};

export function useDashboardState() {
  const [state, setState] = useState<DashboardState>({
    user: getStoredUser(),
    kycStatus: "not_submitted",
    nftStatus: "not_minted",
    company: null,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(true);
    try {
      const [kyc, nft, company] = await Promise.allSettled([
        apiRequest<{ status: KycStatus }>("/kyc/status", {}, token),
        apiRequest<{ status: NftStatus }>("/nft/status", {}, token),
        apiRequest<{ company: { name: string; description: string } | null }>("/company/me", {}, token),
      ]);

      setState((prev) => ({
        ...prev,
        user: getStoredUser(),
        kycStatus: kyc.status === "fulfilled" ? kyc.value.status : prev.kycStatus,
        nftStatus: nft.status === "fulfilled" ? nft.value.status : prev.nftStatus,
        company: company.status === "fulfilled" ? company.value.company : prev.company,
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, loading, refresh };
}
