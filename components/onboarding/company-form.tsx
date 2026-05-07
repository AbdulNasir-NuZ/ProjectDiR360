"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/onboarding/file-upload";
import { api } from "@/lib/api";

type CompanyFormProps = {
  token: string;
  onCreated?: () => void;
};

export function CompanyForm({ token, onCreated }: CompanyFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const company = await api.createCompany(token, {
        name,
        description,
        industry: industry || undefined,
        country: country || undefined,
      });

      if (logo) {
        await api.uploadLogo(token, company.id, logo);
      }

      setName("");
      setDescription("");
      setIndustry("");
      setCountry("");
      setLogo(null);
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
        <CardDescription>Set up your company profile, then mint your on-chain certificate.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            placeholder="Company name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Industry (optional)"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
            <Input
              placeholder="Country (optional)"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Logo (optional, PNG/JPG/SVG, ≤2MB)</p>
            <FileUpload file={logo} onFileChange={setLogo} />
          </div>
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
