"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Link as LinkIcon, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useAccount, useSignMessage, useSignTypedData } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletConnect } from "@/components/onboarding/wallet-connect";
import { api, CompanyResponse, MintReceipt } from "@/lib/api";
import { updateStoredUser } from "@/lib/auth";
import { ensureChain, POLYGON_AMOY_CHAIN_ID } from "@/lib/wallet";

type NftMintCardProps = {
  token: string;
  company: CompanyResponse | null;
  onMinted?: (receipt: MintReceipt) => void;
};

type Stage = "idle" | "linking-wallet" | "preparing" | "signing" | "submitting" | "success" | "error";

export function NftMintCard({ token, company, onMinted }: NftMintCardProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { signTypedDataAsync } = useSignTypedData();

  const [stage, setStage] = useState<Stage>("idle");
  const [walletLinked, setWalletLinked] = useState<string | null>(company?.founderId ? null : null);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<MintReceipt | null>(null);

  // Pre-link state from the stored user (once login lands they may already have linked)
  useEffect(() => {
    if (!walletLinked && address && typeof window !== "undefined") {
      const raw = localStorage.getItem("dire_auth_user");
      if (raw) {
        try {
          const u = JSON.parse(raw) as { walletAddress?: string };
          if (u.walletAddress?.toLowerCase() === address.toLowerCase()) {
            setWalletLinked(address);
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  }, [address, walletLinked]);

  const linkWallet = async (): Promise<boolean> => {
    if (!address) {
      setError("Connect a wallet first.");
      return false;
    }

    try {
      setStage("linking-wallet");
      const challenge = await api.walletChallenge(token, address);
      const signature = await signMessageAsync({ account: address, message: challenge.message });
      await api.walletVerify(token, {
        walletAddress: address,
        message: challenge.message,
        signature,
      });
      updateStoredUser({ walletAddress: address });
      setWalletLinked(address);
      return true;
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Wallet linking failed");
      return false;
    }
  };

  const handleMint = async () => {
    setError(null);
    setReceipt(null);

    if (!company) {
      setError("Create a company first.");
      return;
    }

    if (!address || !isConnected) {
      setError("Connect your wallet first.");
      return;
    }

    if (!walletLinked) {
      const ok = await linkWallet();
      if (!ok) return;
    }

    try {
      setStage("preparing");
      const prepared = await api.prepareMint(token, company.id);

      try {
        await ensureChain(POLYGON_AMOY_CHAIN_ID);
      } catch (chainErr) {
        // If we can't switch chain (user rejected), surface the error and stop.
        setStage("error");
        setError(
          chainErr instanceof Error
            ? `Switch to Polygon Amoy: ${chainErr.message}`
            : "Switch to Polygon Amoy to continue.",
        );
        return;
      }

      setStage("signing");
      const { domain, types, primaryType, value } = prepared.eip712;
      const signature = await signTypedDataAsync({
        account: address,
        domain: {
          name: domain.name,
          version: domain.version,
          chainId: domain.chainId,
          verifyingContract: domain.verifyingContract as `0x${string}`,
        },
        types: types as Record<string, readonly { name: string; type: string }[]>,
        primaryType,
        message: value,
      });

      setStage("submitting");
      const result = await api.commitMint(token, {
        companyId: company.id,
        signature,
        nonce: prepared.nonce,
      });

      setReceipt(result);
      setStage("success");
      onMinted?.(result);
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Mint failed");
    }
  };

  const busy =
    stage === "linking-wallet" || stage === "preparing" || stage === "signing" || stage === "submitting";

  return (
    <Card className="bg-card/80">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Mint Startup Certificate</span>
          {walletLinked && <Badge variant="outline">Wallet linked</Badge>}
        </CardTitle>
        <CardDescription>
          Backend pays gas. You only sign — once to prove ownership of the wallet, once to authorize the mint.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!company && (
          <p className="text-sm text-muted-foreground">Create your company before minting.</p>
        )}

        <WalletConnect />

        {isConnected && address && (
          <p className="text-xs text-muted-foreground">
            Wallet: <span className="font-mono">{address}</span>
          </p>
        )}

        <Button className="w-full" onClick={handleMint} disabled={!company || !isConnected || busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {stage === "success" ? "Mint another" : "Generate certificate"}
        </Button>

        <div className="space-y-1 text-sm">
          {stage === "linking-wallet" && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <LinkIcon className="size-4" /> Sign the ownership challenge in your wallet…
            </p>
          )}
          {stage === "preparing" && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Preparing metadata + IPFS pin…
            </p>
          )}
          {stage === "signing" && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="size-4" /> Sign the EIP-712 mint authorization…
            </p>
          )}
          {stage === "submitting" && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Backend is submitting the on-chain transaction…
            </p>
          )}
          {stage === "success" && receipt && (
            <div className="space-y-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="size-4" /> Mint successful
              </p>
              <p className="text-xs text-muted-foreground">
                Token ID: <span className="font-mono">#{receipt.tokenId}</span>
                {receipt.simulated ? " · simulated" : " · on-chain"}
              </p>
              <p className="break-all font-mono text-xs text-muted-foreground">
                Tx: {receipt.transactionHash}
              </p>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
