/**
 * EIP-1193 helpers used alongside wagmi. Wagmi handles connect / sign / switch
 * via React hooks, but it does not auto-add an unknown chain to the wallet
 * (error 4902). `ensureChain` falls back to `wallet_addEthereumChain` for
 * Polygon Amoy so the EIP-712 mint flow can't deadlock on a missing network.
 */

interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export class WalletNotInstalledError extends Error {
  constructor() {
    super(
      "No injected wallet detected. Install MetaMask or another EIP-1193 wallet to continue.",
    );
    this.name = "WalletNotInstalledError";
  }
}

export class WalletRejectedError extends Error {
  constructor() {
    super("Wallet request was rejected.");
    this.name = "WalletRejectedError";
  }
}

function provider(): Eip1193Provider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new WalletNotInstalledError();
  }
  return window.ethereum;
}

function isUserRejection(err: unknown): boolean {
  const e = err as { code?: number; message?: string };
  return e?.code === 4001 || /user rejected/i.test(e?.message ?? "");
}

const POLYGON_AMOY = {
  chainId: "0x13882", // 80002
  chainName: "Polygon Amoy",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: ["https://rpc-amoy.polygon.technology"],
  blockExplorerUrls: ["https://amoy.polygonscan.com"],
};

async function getChainId(): Promise<number> {
  const hex = (await provider().request({ method: "eth_chainId" })) as string;
  return parseInt(hex, 16);
}

export async function ensureChain(targetChainId: number): Promise<void> {
  const current = await getChainId();
  if (current === targetChainId) return;

  const chainIdHex = "0x" + targetChainId.toString(16);
  try {
    await provider().request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    return;
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 4902 && targetChainId === 80002) {
      await provider().request({
        method: "wallet_addEthereumChain",
        params: [POLYGON_AMOY],
      });
      return;
    }
    if (isUserRejection(err)) throw new WalletRejectedError();
    throw err;
  }
}

export const POLYGON_AMOY_CHAIN_ID = 80002;
