"use client";

import { FormEvent, useState } from "react";
import { Loader2, Plug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { getAuthToken, getStoredUser, updateStoredUser } from "@/lib/auth";

export default function ProfilePage() {
  const initialUser = getStoredUser();
  const [fullName, setFullName] = useState(initialUser?.fullName ?? "");
  const [walletAddress, setWalletAddress] = useState(initialUser?.walletAddress ?? "");
  const [saved, setSaved] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = (event: FormEvent) => {
    event.preventDefault();
    updateStoredUser({ fullName });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const disconnectWallet = async () => {
    const token = getAuthToken();
    if (!token) return;

    setDisconnecting(true);
    setError(null);
    try {
      await api.walletDisconnect(token);
      updateStoredUser({ walletAddress: undefined });
      setWalletAddress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Manage your account details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2 text-sm">
          <p>
            Email: <span className="text-muted-foreground">{initialUser?.email ?? "-"}</span>
          </p>
          <p>
            Wallet:{" "}
            <span className="font-mono text-muted-foreground">
              {walletAddress || "Not connected"}
            </span>
          </p>
        </div>

        <form className="space-y-3" onSubmit={onSave}>
          <Input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit">Save profile</Button>
            {saved && <Badge variant="outline">Saved</Badge>}
            {walletAddress && (
              <Button type="button" variant="outline" onClick={disconnectWallet} disabled={disconnecting}>
                {disconnecting ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
                Disconnect wallet
              </Button>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
