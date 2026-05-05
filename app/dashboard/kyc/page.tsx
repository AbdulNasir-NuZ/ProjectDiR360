"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/onboarding/file-upload";
import { useDashboardState } from "@/components/onboarding/use-dashboard-state";
import { apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

export default function KycPage() {
  const { state, refresh } = useDashboardState();
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState("passport");
  const [idNumber, setIdNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const token = getAuthToken();
    if (!token || !file) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("country", country);
      formData.append("phone", phone);
      formData.append("idType", idType);
      formData.append("idNumber", idNumber);
      formData.append("document", file);

      await apiRequest<{ status: string }>("/kyc/upload", {
        method: "POST",
        body: formData,
      }, token);

      setMessage("Verification in progress");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>KYC Verification</CardTitle>
        <CardDescription>Submit your details for identity verification.</CardDescription>
        <Badge variant="outline" className="w-fit">Status: {state.kycStatus}</Badge>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <Input placeholder="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input placeholder="Country" required value={country} onChange={(e) => setCountry(e.target.value)} />
          <Input placeholder="Phone number" required value={phone} onChange={(e) => setPhone(e.target.value)} />

          <div className="grid gap-4 md:grid-cols-2">
            <Select value={idType} onValueChange={setIdType}>
              <SelectTrigger><SelectValue placeholder="ID type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="national_id">National ID</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="ID number" required value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
          </div>

          <FileUpload file={file} onFileChange={setFile} />

          {state.kycStatus === "pending" && <p className="text-sm text-muted-foreground">Verification in progress...</p>}
          {state.kycStatus === "rejected" && <p className="text-sm text-destructive">KYC rejected. Please resubmit.</p>}
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading || !file}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Submit KYC
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
