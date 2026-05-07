"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CertificateResponse } from "@/lib/api";

type Props = {
  certificate: CertificateResponse;
  verifyUrl: string;
};

export default function CertificateDownloadButton({ certificate, verifyUrl }: Props) {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    try {
      const mod = await import("@/components/certificate-pdf");
      await mod.downloadCertificatePdf(certificate, verifyUrl);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" onClick={onClick} disabled={busy}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      Download PDF
    </Button>
  );
}
