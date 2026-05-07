"use client";

import { CertificateResponse } from '@/lib/api';

/**
 * Generates a printable PDF of the on-chain certificate and triggers a browser
 * download. Pure client-side. jspdf + qrcode are imported lazily so Turbopack
 * does not try to bundle their Node worker code during SSR.
 */
export async function downloadCertificatePdf(
  cert: CertificateResponse,
  verifyUrl: string,
): Promise<void> {
  const [{ jsPDF }, QRCodeMod] = await Promise.all([
    import('jspdf'),
    import('qrcode'),
  ]);
  const QRCode = (QRCodeMod as unknown as { default?: typeof QRCodeMod }).default ?? QRCodeMod;

  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

  const navy = '#0a1f4a';
  const blue = '#1a4e8a';
  const gold = '#c9a54c';

  // Header band
  pdf.setFillColor(navy);
  pdf.rect(0, 0, 210, 38, 'F');

  pdf.setTextColor('#ffffff');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.text('ReDi Certificate', 20, 20);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text('Verifiable on-chain startup identity · Polygon Amoy', 20, 28);

  // Body
  pdf.setTextColor('#1a1a1a');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text(cert.companyName, 20, 60);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  const status = cert.isLegal
    ? `Legal entity · Registration #${cert.registrationNo ?? '—'}`
    : 'Pre-Company';
  pdf.setTextColor(blue);
  pdf.text(status, 20, 68);

  pdf.setTextColor('#1a1a1a');
  pdf.setFontSize(10);

  let y = 88;
  const row = (label: string, value: string) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, 20, y);
    pdf.setFont('helvetica', 'normal');
    const wrapped = pdf.splitTextToSize(value, 130);
    pdf.text(wrapped, 60, y);
    y += 7 * Math.max(1, Array.isArray(wrapped) ? wrapped.length : 1);
  };

  row('Token ID', cert.tokenId);
  row('Founder', cert.founderAddress);
  row('Contract', cert.contractAddress);
  row('Tx hash', cert.transactionHash);
  row('Chain ID', cert.chainId ?? '—');
  row('IPFS', cert.ipfsUri);
  row('Minted', cert.mintedAt ? new Date(cert.mintedAt).toLocaleString() : '—');

  // Attributes
  if (cert.metadata?.attributes?.length) {
    y += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(blue);
    pdf.text('Attributes', 20, y);
    y += 6;

    pdf.setFontSize(10);
    pdf.setTextColor('#1a1a1a');
    pdf.setFont('helvetica', 'normal');

    for (const attr of cert.metadata.attributes) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${attr.trait_type}:`, 20, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(String(attr.value), 60, y);
      y += 6;
    }
  }

  // QR code on the right
  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 240,
      margin: 1,
      color: { dark: navy, light: '#ffffff' },
    });
    pdf.addImage(qrDataUrl, 'PNG', 145, 88, 45, 45);
    pdf.setFontSize(8);
    pdf.setTextColor('#666666');
    pdf.text('Scan to verify', 145, 138);
  } catch {
    // QR render failure shouldn't break the PDF
  }

  // Footer
  pdf.setDrawColor(gold);
  pdf.setLineWidth(0.5);
  pdf.line(20, 270, 190, 270);

  pdf.setFontSize(8);
  pdf.setTextColor('#666666');
  pdf.text(`Verify: ${verifyUrl}`, 20, 278);
  pdf.text(
    cert.simulated ? 'Simulated mint — no chain config in backend.' : 'On-chain — Polygon Amoy.',
    20,
    283,
  );

  pdf.save(`redi-cert-${cert.tokenId}.pdf`);
}
