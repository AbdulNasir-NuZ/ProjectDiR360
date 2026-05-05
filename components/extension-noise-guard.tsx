"use client";

import { useEffect } from "react";

function isExtensionNoise(value: unknown): boolean {
  const text = String(value ?? "");
  return (
    text.includes("chrome-extension://") ||
    text.includes("MetaMask") ||
    text.includes("Cannot redefine property: ethereum") ||
    text.includes("Failed to connect to MetaMask")
  );
}

export function ExtensionNoiseGuard() {
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (
        isExtensionNoise(reason) ||
        isExtensionNoise((reason as { message?: string })?.message) ||
        isExtensionNoise((reason as { stack?: string })?.stack)
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };

    const onError = (event: ErrorEvent) => {
      if (
        isExtensionNoise(event.message) ||
        isExtensionNoise(event.filename) ||
        isExtensionNoise(event.error?.message) ||
        isExtensionNoise(event.error?.stack)
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection, true);
    window.addEventListener("error", onError, true);

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection, true);
      window.removeEventListener("error", onError, true);
    };
  }, []);

  return null;
}
