import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ExtensionNoiseGuard } from '@/components/extension-noise-guard'
import './globals.css'

export const metadata: Metadata = {
  title: 'COMPUTE - AI Agents for Distributed Computing',
  description: 'Deploy autonomous AI agents on distributed infrastructure. Offload complex tasks to intelligent workers that run 24/7.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ExtensionNoiseGuard />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
