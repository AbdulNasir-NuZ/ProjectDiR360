"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletConnect } from "@/components/onboarding/wallet-connect";
import { apiRequest } from "@/lib/api";

const contractAbi = [
  "function mintCompany(address to, string metadataURI) returns (uint256)",
];

type NftMintCardProps = {
  token: string;
};

export function NftMintCard({ token }: NftMintCardProps) {
  const { address } = useAccount();
  const [stage, setStage] = useState<"idle" | "backend" | "wallet" | "pending" | "success" | "error">("idle");
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMint = async () => {
    setError(null);
    setTokenId(null);

    if (!address) {
      setStage("wallet");
      return;
    }

    try {
      setStage("backend");
      const metadata = await apiRequest<{ metadataURI: string }>("/nft/metadata", {
        method: "POST",
      }, token);

      const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
      if (!contractAddress) throw new Error("Missing NEXT_PUBLIC_NFT_CONTRACT_ADDRESS");
      const ethereumProvider = (window as Window & { ethereum?: ethers.Eip1193Provider }).ethereum;
      if (!ethereumProvider) throw new Error("MetaMask not found");

      const browserProvider = new ethers.BrowserProvider(ethereumProvider);
      await browserProvider.send("eth_requestAccounts", []);
      const signer = await browserProvider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractAbi, signer);

      setStage("pending");
      const tx = await contract.mintCompany(address, metadata.metadataURI);
      const receipt = await tx.wait();

      const transferLog = receipt?.logs?.find((log: { topics?: string[] }) => log.topics?.length === 4);
      if (transferLog?.topics?.[3]) {
        setTokenId(BigInt(transferLog.topics[3]).toString());
      }

      await apiRequest("/nft/mark-minted", {
        method: "POST",
        body: JSON.stringify({
          tokenId: transferLog?.topics?.[3] ? BigInt(transferLog.topics[3]).toString() : null,
        }),
      }, token);

      setStage("success");
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Mint failed");
    }
  };

  return (
    <Card className="bg-card/80">
      <CardHeader>
        <CardTitle>Mint Startup NFT</CardTitle>
        <CardDescription>Mint your verified company NFT on-chain.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!address && <WalletConnect />}

        <Button className="w-full" onClick={handleMint} disabled={stage === "backend" || stage === "pending"}>
          {(stage === "backend" || stage === "pending") ? <Loader2 className="size-4 animate-spin" /> : null}
          Mint Startup NFT
        </Button>

        <p className="text-sm text-muted-foreground">
          {stage === "backend" && "Preparing metadata URI..."}
          {stage === "wallet" && "Connect wallet to continue."}
          {stage === "pending" && "Transaction pending on chain..."}
          {stage === "success" && "Mint successful."}
        </p>

        {tokenId && <p className="text-sm">Token ID: <span className="font-mono">#{tokenId}</span></p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
