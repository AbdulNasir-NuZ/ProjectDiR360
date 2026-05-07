"use client";

import { FormEvent, useState } from "react";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/onboarding/file-upload";
import { useDashboardState } from "@/components/onboarding/use-dashboard-state";
import { api } from "@/lib/api";
import { getAuthToken, updateStoredUser } from "@/lib/auth";

export default function KycPage() {
  const { state, refresh } = useDashboardState();
  const [fullName, setFullName] = useState(state.user?.fullName ?? "");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState("passport");
  const [idNumber, setIdNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoApproving, setDemoApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const submitDocument = async (event: FormEvent) => {
    event.preventDefault();
    const token = getAuthToken();
    if (!token || !file) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const result = await api.uploadKycDocument(token, file);
      updateStoredUser({
        fullName: fullName || undefined,
        kycStatus: (result.kycStatus as "pending" | "approved" | "rejected") ?? "pending",
      });
      setMessage("Document submitted. Verification in progress.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const selfApprove = async () => {
    const token = getAuthToken();
    if (!token) return;

    setDemoApproving(true);
    setError(null);
    setMessage(null);

    try {
      const user = await api.selfApproveKyc(token);
      updateStoredUser({
        fullName: fullName || undefined,
        kycStatus: (user.kycStatus as "pending" | "approved" | "rejected") ?? "approved",
      });
      setMessage("Demo KYC approved. You can now create a company and mint.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Self-approve failed");
    } finally {
      setDemoApproving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>KYC Verification</CardTitle>
        <CardDescription>Submit your identity document, or use demo self-approve.</CardDescription>
        <Badge variant="outline" className="w-fit">Status: {state.kycStatus}</Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={submitDocument}>
          <Input
            placeholder="Full name (saved to your profile)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
          <Input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <div className="grid gap-4 md:grid-cols-2">
            <Select value={idType} onValueChange={setIdType}>
              <SelectTrigger><SelectValue placeholder="ID type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="national_id">National ID</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="ID number" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
          </div>

          <FileUpload file={file} onFileChange={setFile} />

          <p className="text-xs text-muted-foreground">
            Only the uploaded document is sent to the backend in v1. The other fields are stored locally with your profile.
          </p>

          {state.kycStatus === "pending" && (
            <p className="text-sm text-muted-foreground">Verification in progress…</p>
          )}
          {state.kycStatus === "rejected" && (
            <p className="text-sm text-destructive">KYC rejected. Please resubmit.</p>
          )}
          {message && <p className="text-sm text-emerald-400">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={submitting || !file || demoApproving}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Submit document
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={selfApprove}
              disabled={submitting || demoApproving}
            >
              {demoApproving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Demo self-approve
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
