"use client";

import { FormEvent, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getStoredUser, updateStoredUser } from "@/lib/auth";

export default function ProfilePage() {
  const user = getStoredUser();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [saved, setSaved] = useState(false);

  const onSave = (event: FormEvent) => {
    event.preventDefault();
    updateStoredUser({ fullName });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Manage your account details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2 text-sm">
          <p>Email: <span className="text-muted-foreground">{user?.email ?? "-"}</span></p>
          <p>Wallet: <span className="font-mono text-muted-foreground">{user?.walletAddress ?? "Not connected"}</span></p>
        </div>

        <form className="space-y-3" onSubmit={onSave}>
          <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <div className="flex items-center gap-3">
            <Button type="submit">Save profile</Button>
            {saved && <Badge variant="outline">Saved</Badge>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
