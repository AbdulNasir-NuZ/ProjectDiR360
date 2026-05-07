"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Award, ExternalLink, Loader2, ScrollText, ShieldCheck } from "lucide-react";

const CertificateDownloadButton = dynamic(
  () => import("@/components/certificate-download-button"),
  { ssr: false },
);
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NftMintCard } from "@/components/onboarding/nft-mint-card";
import { useDashboardState } from "@/components/onboarding/use-dashboard-state";
import { QrCode } from "@/components/qr-code";
import { api, CertificateResponse } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

function getPublicAppOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export default function NftPage() {
  const { state, refresh } = useDashboardState();
  const token = getAuthToken();

  const [certificate, setCertificate] = useState<CertificateResponse | null>(null);
  const [loadingCert, setLoadingCert] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [registrationNo, setRegistrationNo] = useState("");
  const [legalName, setLegalName] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const company = state.company;

  const fetchCert = useCallback(async () => {
    if (!company?.nftTokenId) {
      setCertificate(null);
      return;
    }
    setLoadingCert(true);
    setCertError(null);
    try {
      const cert = await api.getCertificate(company.id);
      setCertificate(cert);
    } catch (err) {
      setCertError(err instanceof Error ? err.message : "Could not load certificate");
    } finally {
      setLoadingCert(false);
    }
  }, [company?.id, company?.nftTokenId]);

  useEffect(() => {
    void fetchCert();
  }, [fetchCert]);

  const verifyUrl = useMemo(() => {
    if (!certificate?.tokenId) return "";
    return `${getPublicAppOrigin()}/verify/${certificate.tokenId}`;
  }, [certificate?.tokenId]);

  const onUpgradeSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !company) return;

    setUpgrading(true);
    setUpgradeError(null);
    try {
      await api.upgradeLegal(token, {
        companyId: company.id,
        registrationNo: registrationNo.trim(),
        legalName: legalName.trim() || undefined,
      });
      setUpgradeOpen(false);
      setRegistrationNo("");
      setLegalName("");
      await refresh();
      await fetchCert();
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : "Upgrade failed");
    } finally {
      setUpgrading(false);
    }
  };

  if (state.kycStatus !== "approved") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NFT Mint Locked</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Complete KYC approval before minting.
        </CardContent>
      </Card>
    );
  }

  if (!company) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create a company first</CardTitle>
          <CardDescription>You need a company profile before minting the certificate NFT.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/dashboard/company">Create company</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!token) return null;

  // Pre-mint
  if (!company.nftTokenId) {
    return (
      <NftMintCard
        token={token}
        company={company}
        onMinted={async () => {
          await refresh();
          await fetchCert();
        }}
      />
    );
  }

  // Post-mint: certificate panel + legal upgrade
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Award className="size-5 text-amber-300" />
              {certificate?.companyName ?? company.name}
            </span>
            <div className="flex items-center gap-2">
              {certificate?.simulated && <Badge variant="outline">Simulated</Badge>}
              {certificate && !certificate.simulated && <Badge variant="outline">On-chain</Badge>}
              {certificate?.isLegal && <Badge>Legal</Badge>}
            </div>
          </CardTitle>
          <CardDescription>
            Token ID <span className="font-mono">#{certificate?.tokenId ?? company.nftTokenId}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingCert && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading certificate…
            </p>
          )}
          {certError && <p className="text-sm text-destructive">{certError}</p>}

          {certificate && (
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-2 text-sm">
                <p>
                  Founder:{" "}
                  <span className="break-all font-mono text-muted-foreground">
                    {certificate.founderAddress}
                  </span>
                </p>
                <p>
                  Contract:{" "}
                  <span className="break-all font-mono text-muted-foreground">
                    {certificate.contractAddress}
                  </span>
                </p>
                <p>
                  Tx:{" "}
                  <a
                    className="break-all font-mono text-primary underline"
                    href={certificate.polygonscanUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {certificate.transactionHash}
                  </a>
                </p>
                <p>
                  IPFS:{" "}
                  <a
                    className="break-all font-mono text-primary underline"
                    href={certificate.ipfsGatewayUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {certificate.ipfsUri}
                  </a>
                </p>
                {certificate.isLegal && certificate.registrationNo && (
                  <p>
                    Registration #:{" "}
                    <span className="font-mono text-muted-foreground">{certificate.registrationNo}</span>
                  </p>
                )}
                {certificate.mintedAt && (
                  <p>
                    Minted: <span className="text-muted-foreground">{new Date(certificate.mintedAt).toLocaleString()}</span>
                  </p>
                )}
              </div>

              {verifyUrl && (
                <div className="flex flex-col items-center gap-2 rounded-md border border-border bg-card/60 p-3">
                  <QrCode value={verifyUrl} size={140} />
                  <a
                    className="flex items-center gap-1 text-xs text-primary underline"
                    href={verifyUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open verify <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {certificate && (
              <CertificateDownloadButton certificate={certificate} verifyUrl={verifyUrl} />
            )}
            {!certificate?.isLegal && (
              <Button onClick={() => setUpgradeOpen(true)} disabled={!certificate}>
                <ScrollText className="size-4" />
                Upgrade to legal entity
              </Button>
            )}
            <Button variant="ghost" onClick={fetchCert} disabled={loadingCert}>
              {loadingCert ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to legal entity</DialogTitle>
            <DialogDescription>
              Provide your registration number. The backend will pin new metadata to IPFS and call
              <span className="font-mono"> upgradeToLegal </span>
              on-chain. Same NFT, no new mint.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onUpgradeSubmit} className="space-y-3">
            <Input
              placeholder="Registration number"
              value={registrationNo}
              onChange={(e) => setRegistrationNo(e.target.value)}
              required
            />
            <Input
              placeholder="Legal name (optional)"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
            />
            {upgradeError && <p className="text-sm text-destructive">{upgradeError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUpgradeOpen(false)} disabled={upgrading}>
                Cancel
              </Button>
              <Button type="submit" disabled={upgrading || !registrationNo.trim()}>
                {upgrading ? <Loader2 className="size-4 animate-spin" /> : <ScrollText className="size-4" />}
                Upgrade
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
