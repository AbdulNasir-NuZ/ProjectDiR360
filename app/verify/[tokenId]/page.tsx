"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Award, CheckCircle2, ExternalLink, Loader2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode } from "@/components/qr-code";
import { api, CertificateResponse } from "@/lib/api";

export default function VerifyPage() {
  const params = useParams<{ tokenId: string }>();
  const tokenId = params?.tokenId ?? "";
  const [cert, setCert] = useState<CertificateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getCertificateByTokenId(tokenId)
      .then((c) => {
        if (!cancelled) setCert(c);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load certificate");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tokenId]);

  const verifyUrl = useMemo(() => {
    if (typeof window === "undefined" || !cert?.tokenId) return "";
    return `${window.location.origin}/verify/${cert.tokenId}`;
  }, [cert?.tokenId]);

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto w-full max-w-3xl px-6">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Home
          </Link>
          <Badge variant="outline">Public verification</Badge>
        </div>

        {loading && (
          <Card>
            <CardContent className="flex items-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Looking up certificate #{tokenId}…
            </CardContent>
          </Card>
        )}

        {error && !loading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="size-5" />
                Certificate not found
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/">Back home</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {cert && !loading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Award className="size-6 text-amber-300" />
                  {cert.companyName}
                </span>
                <div className="flex items-center gap-2">
                  {cert.simulated && <Badge variant="outline">Simulated</Badge>}
                  {!cert.simulated && <Badge variant="outline">On-chain</Badge>}
                  {cert.isLegal && <Badge>Legal</Badge>}
                </div>
              </CardTitle>
              <CardDescription className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="size-4" /> Verified — Token #{cert.tokenId}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-[1fr_auto]">
              <div className="space-y-2 text-sm">
                {cert.metadata?.description && (
                  <p className="text-muted-foreground">{cert.metadata.description}</p>
                )}
                <p>
                  Founder:{" "}
                  <span className="break-all font-mono text-muted-foreground">{cert.founderAddress}</span>
                </p>
                <p>
                  Contract:{" "}
                  <span className="break-all font-mono text-muted-foreground">{cert.contractAddress}</span>
                </p>
                <p>
                  Tx:{" "}
                  <a
                    className="break-all font-mono text-primary underline"
                    href={cert.polygonscanUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {cert.transactionHash}
                  </a>
                </p>
                <p>
                  IPFS:{" "}
                  <a
                    className="break-all font-mono text-primary underline"
                    href={cert.ipfsGatewayUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {cert.ipfsUri}
                  </a>
                </p>
                {cert.isLegal && cert.registrationNo && (
                  <p>
                    Registration #:{" "}
                    <span className="font-mono text-muted-foreground">{cert.registrationNo}</span>
                  </p>
                )}
                {cert.mintedAt && (
                  <p>
                    Minted:{" "}
                    <span className="text-muted-foreground">
                      {new Date(cert.mintedAt).toLocaleString()}
                    </span>
                  </p>
                )}

                {cert.metadata?.attributes?.length ? (
                  <div className="pt-2">
                    <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Attributes</p>
                    <ul className="grid gap-1 text-xs md:grid-cols-2">
                      {cert.metadata.attributes.map((attr) => (
                        <li
                          key={`${attr.trait_type}-${String(attr.value)}`}
                          className="rounded-md border border-border bg-card/60 px-2 py-1"
                        >
                          <span className="font-medium">{attr.trait_type}: </span>
                          <span className="text-muted-foreground">{String(attr.value)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              {verifyUrl && (
                <div className="flex flex-col items-center gap-2 rounded-md border border-border bg-card/60 p-3">
                  <QrCode value={verifyUrl} size={150} />
                  <a
                    className="flex items-center gap-1 text-xs text-primary underline"
                    href={cert.polygonscanUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on Polygonscan <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
