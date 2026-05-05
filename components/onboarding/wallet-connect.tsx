"use client";

import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount, useConnect, useDisconnect } from "wagmi";

type WalletConnectProps = {
  onConnected?: (address: string) => void;
};

export function WalletConnect({ onConnected }: WalletConnectProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const injectedConnector = connectors[0];

  const handleConnect = async () => {
    connect(
      { connector: injectedConnector },
      {
        onSuccess(data) {
          if (data.accounts?.[0]) {
            onConnected?.(data.accounts[0]);
          }
        },
      },
    );
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
        <Wallet className="size-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>
        <Button variant="ghost" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" variant="outline" className="w-full" onClick={handleConnect} disabled={isPending}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
      Connect MetaMask
    </Button>
  );
}
