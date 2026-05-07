"use client";

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCode({ value, size = 160, className }: QrCodeProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    QRCode.toCanvas(ref.current, value, {
      width: size,
      margin: 1,
      color: { dark: '#0a1f4a', light: '#ffffff' },
    }).catch((err) => {
      // Don't crash the page on a malformed input — just log.
      console.warn('QR render failed:', err);
    });
  }, [value, size]);

  return <canvas ref={ref} className={className} aria-label={`QR for ${value}`} />;
}
