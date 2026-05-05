import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { ExtensionNoiseGuard } from '@/components/extension-noise-guard'
import { Web3Provider } from '@/components/web3/web3-provider'
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
  const extensionNoiseBootGuard = `
    (function () {
      var isNoise = function (value) {
        var text = String(value == null ? "" : value);
        return (
          text.indexOf("chrome-extension://") !== -1 ||
          text.indexOf("MetaMask") !== -1 ||
          text.indexOf("Cannot redefine property: ethereum") !== -1 ||
          text.indexOf("Failed to connect to MetaMask") !== -1 ||
          text.indexOf("inpage.js") !== -1
        );
      };

      var patchConsole = function (method) {
        var original = console[method];
        if (typeof original !== "function") return;
        console[method] = function () {
          for (var i = 0; i < arguments.length; i += 1) {
            if (isNoise(arguments[i])) {
              return;
            }
          }
          return original.apply(console, arguments);
        };
      };

      patchConsole("error");
      patchConsole("warn");

      window.addEventListener("unhandledrejection", function (event) {
        var reason = event && event.reason;
        if (
          isNoise(reason) ||
          isNoise(reason && reason.message) ||
          isNoise(reason && reason.stack)
        ) {
          event.stopImmediatePropagation();
          event.preventDefault();
        }
      }, true);

      window.addEventListener("error", function (event) {
        var err = event && event.error;
        if (
          isNoise(event && event.message) ||
          isNoise(event && event.filename) ||
          isNoise(err && err.message) ||
          isNoise(err && err.stack)
        ) {
          event.stopImmediatePropagation();
          event.preventDefault();
        }
      }, true);
    })();
  `

  return (
    <html lang="en">
      <head>
        <Script
          id="extension-noise-boot-guard"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: extensionNoiseBootGuard }}
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ExtensionNoiseGuard />
        <Web3Provider>{children}</Web3Provider>
        <Analytics />
      </body>
    </html>
  )
}
