"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api";

type CompanyFormProps = {
  token: string;
  onCreated?: () => void;
};

export function CompanyForm({ token, onCreated }: CompanyFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiRequest("/company/create", {
        method: "POST",
        body: JSON.stringify({ name, description }),
      }, token);
      setName("");
      setDescription("");
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create company.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/80">
      <CardHeader>
        <CardTitle>Create Company</CardTitle>
        <CardDescription>Set up your company profile before minting the NFT.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Save company
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
