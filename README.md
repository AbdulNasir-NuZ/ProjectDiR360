<div align="center">

# ProjectDiR360

**Frontend for the [ReDi Web3](https://github.com/AbdulNasir-NuZ/ReDi-web3) startup-registration platform.**

A Next.js 16 + React 19 app that lets founders sign up, complete KYC, register a company, and mint a soulbound on-chain identity certificate on Polygon Amoy — all without paying gas. The backend signs the on-chain transaction; the user just signs typed data in their wallet.

[![Stack](https://img.shields.io/badge/stack-Next.js%2016%20%E2%80%A2%20React%2019%20%E2%80%A2%20wagmi-1a4e8a)]() [![Chain](https://img.shields.io/badge/chain-Polygon%20Amoy%20(80002)-8247e5)]() [![License](https://img.shields.io/badge/license-UNLICENSED-lightgrey)]()

</div>

---

## What this repo is

This is the **UI layer only**. It calls a NestJS backend over REST, which in turn talks to the Polygon Amoy contract. You need both repos running locally to use the app:

| Repo | What it owns |
|---|---|
| [ReDi-web3](https://github.com/AbdulNasir-NuZ/ReDi-web3) | NestJS backend (auth, KYC, company, gasless mint, IPFS, mint listener) + Hardhat contracts (`StartupRegistry.sol`) |
| **ProjectDiR360** (this repo) | Next.js frontend |

The frontend never holds private keys, never signs on-chain transactions, and never reads from the chain directly. All chain interaction goes through the backend; the user only signs **EIP-712 typed data** and **personal_sign** challenges in their wallet.

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack), React 19, TypeScript 5 |
| UI | Tailwind v4, Radix primitives via shadcn (~50 components), Geist font, lucide-react icons, sonner toasts |
| Web3 | wagmi v2, viem, ethers v6 (lazy-loaded), `@tanstack/react-query` |
| 3D | `@react-three/fiber` + `three` (landing-page scene only) |
| Forms | react-hook-form + zod |
| Cert export | jspdf + qrcode (lazy-loaded via `next/dynamic({ ssr: false })`) |
| Analytics | `@vercel/analytics` |

There is **no backend code in this repo** — every API call goes to `NEXT_PUBLIC_API_BASE_URL`.

---

## Quick start (local)

### Prerequisites

- Node.js 20+ and npm (or pnpm — both lockfiles are committed)
- A running ReDi backend on `http://localhost:4000` (see [the backend repo](https://github.com/AbdulNasir-NuZ/ReDi-web3) for setup)
- MetaMask (or any EIP-1193 wallet) installed in your browser
- Optional, only for real on-chain mints: a wallet on Polygon Amoy (testnet POL from [the faucet](https://faucet.polygon.technology/))

### Install + run

```bash
# 1. Clone
git clone https://github.com/AbdulNasir-NuZ/ProjectDiR360.git
cd ProjectDiR360

# 2. Install
npm install

# 3. Configure env
cp .env.example .env.local
# .env.local should contain at minimum:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
# NEXT_PUBLIC_APP_URL=http://localhost:3000

# 4. Make sure the backend is up on :4000, then:
npm run dev
```

Open `http://localhost:3000` → click **Sign in / Get started** → on `/auth` click **Use demo account** → walk through the dashboard.

### End-to-end demo walkthrough

| Step | Where | What happens |
|---|---|---|
| 1 | `/auth` | Use demo account (or sign up with your own email). Backend issues a JWT, stored under `dire_access_token` in localStorage. |
| 2 | `/dashboard/kyc` | Click **Demo self-approve**. Backend marks the user `kycStatus=approved`. |
| 3 | `/dashboard/company` | Fill name + description + optional logo. Backend creates a `Company` row and pins the logo to IPFS. |
| 4 | `/dashboard/nft` | Click **Connect MetaMask** → wallet popup #1: sign a `personal_sign` challenge that proves wallet ownership. The backend links your wallet to your account. |
| 5 | `/dashboard/nft` | Click **Generate certificate** → wallet popup #2: sign EIP-712 typed data authorizing the mint. The backend pays gas, calls `mintCompany` on-chain, returns the receipt. Certificate panel appears. |
| 6 | `/dashboard/nft` | Download a printable PDF, see the QR code, optionally click **Upgrade to legal entity** to set a registration number. |
| 7 | `/verify/<tokenId>` | Open in incognito (or any browser, no auth). Anyone can verify the certificate via the QR code. |

If the backend has no `RPC_URL`/`PRIVATE_KEY` configured, it runs in **simulated mode** — the certificate badge says "Simulated" and no real transaction lands on-chain. The flow is otherwise identical, which makes the demo trivial to run without faucet wrangling.

---

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | yes | `http://localhost:4000` | NestJS backend origin. Every REST call hits `${this}/auth/...`, `${this}/web3/...`, etc. |
| `NEXT_PUBLIC_APP_URL` | no | `window.location.origin` (browser) | Public origin of THIS frontend. Used to build `/verify/<tokenId>` URLs that go into the certificate QR code. Set this in production so QR codes link to your deployed origin, not localhost. |

Both vars must be prefixed `NEXT_PUBLIC_` so they're exposed to the client bundle. Place them in `.env.local` (gitignored) for dev, and in your hosting provider's env settings for prod.

---

## Project structure

```
ProjectDiR360/
├── app/                              Next.js App Router
│   ├── page.tsx                      Landing page (12 sections)
│   ├── auth/                         /auth, /auth/callback (Google OAuth landing — currently unused)
│   ├── dashboard/                    Protected via RequireAuth wrapper
│   │   ├── page.tsx                  Overview
│   │   ├── kyc/page.tsx              Self-approve demo + document upload
│   │   ├── company/page.tsx          Create + view company; trigger to /dashboard/nft
│   │   ├── nft/page.tsx              Pre-mint card | post-mint certificate panel + legal upgrade
│   │   └── profile/page.tsx          Display + wallet disconnect
│   └── verify/[tokenId]/page.tsx     Public, no auth
├── components/
│   ├── landing/                      Marketing page sections + 3D ASCII scene
│   ├── onboarding/                   wallet-connect, company-form, file-upload,
│   │                                 nft-mint-card, dashboard-shell, require-auth, use-dashboard-state
│   ├── web3/web3-provider.tsx        WagmiProvider config (Polygon Amoy chain)
│   ├── certificate-pdf.tsx           jspdf-based cert renderer (client-side only)
│   ├── certificate-download-button.tsx  Wraps cert-pdf via next/dynamic({ ssr: false })
│   ├── qr-code.tsx                   Canvas-based QR
│   └── ui/                           shadcn primitives (button, card, dialog, input, etc.)
├── lib/
│   ├── api.ts                        Typed REST client for every NestJS endpoint
│   ├── auth.ts                       localStorage-backed JWT + StoredUser helpers
│   ├── wallet.ts                     ensureChain helper (wallet_addEthereumChain fallback)
│   └── utils.ts                      cn() classname merger
├── hooks/                            use-mobile, use-toast (UI utilities)
├── public/                           Static assets (logos, hero images)
├── styles/                           Global Tailwind setup
├── .env.example                      Template — copy to .env.local
└── next.config.mjs
```

---

## Web3 wiring

### Wagmi config

[`components/web3/web3-provider.tsx`](components/web3/web3-provider.tsx) configures wagmi with **only Polygon Amoy** (chainId 80002). If you change the contract chain on the backend side, update this file to match — chain mismatches silently break EIP-712 signing because MetaMask refuses to sign typed data when the active chain doesn't match `domain.chainId`.

### Mint flow (gasless, EIP-712)

[`components/onboarding/nft-mint-card.tsx`](components/onboarding/nft-mint-card.tsx):

```
useAccount() → useSignMessage()       step 1: ownership challenge (personal_sign)
   POST /web3/wallet/challenge
   POST /web3/wallet/verify           backend links wallet to user

ensureChain(80002)                    add + switch to Polygon Amoy if needed
useSignTypedData()                    step 2: EIP-712 mint authorization
   POST /web3/mint/prepare            backend pins metadata to IPFS, returns typed data
   POST /web3/mint                    backend submits the on-chain tx, returns receipt
```

**The user pays no gas at any point.** The contract has a `MINTER_ROLE` granted only to the backend's signing wallet; the user signs the EIP-712 authorization (which proves intent), and the backend's wallet submits the actual transaction.

---

## Production build

```bash
npm run build
npm run start          # serves the production build on :3000
```

The production build prerenders 9 routes statically (`/`, `/auth`, `/auth/callback`, `/dashboard/*`) and one dynamic route (`/verify/[tokenId]`) which is server-rendered on demand. jspdf and qrcode are deferred to a client-only chunk so they don't bloat the SSR bundle.

### Deploying

- **Vercel**: zero-config — set `NEXT_PUBLIC_API_BASE_URL` to your backend origin and `NEXT_PUBLIC_APP_URL` to your deployed origin in the project settings, then push.
- **Self-hosted Node**: `npm run build && npm run start` behind any reverse proxy.
- **Static export**: not supported because `/verify/[tokenId]` is dynamic by design (it fetches per-token data at request time).

Make sure the backend's `ALLOWED_ORIGINS` env includes your deployed frontend origin or the browser will block requests at the CORS layer.

---

## Connecting to a deployed backend

If your backend isn't on localhost:

```bash
# .env.local (or your host's env settings)
NEXT_PUBLIC_API_BASE_URL=https://api.your-backend.example.com
NEXT_PUBLIC_APP_URL=https://app.your-domain.example.com
```

Restart `npm run dev` after changing env vars — Next reads them once at startup.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot reach backend at http://localhost:4000` on the auth page | Backend isn't running, or `NEXT_PUBLIC_API_BASE_URL` is wrong | Start the backend; verify `.env.local` |
| `Failed to fetch` after deployment | CORS — backend doesn't list this origin | Add the FE origin to `ALLOWED_ORIGINS` in `backend/.env` |
| MetaMask says "wrong chain" when signing typed data | Wallet on a different chain than the EIP-712 domain | Click **Generate certificate** again — `ensureChain(80002)` will prompt to switch / add Polygon Amoy |
| Mint succeeds but cert shows "Simulated" | Backend has no `RPC_URL` / `PRIVATE_KEY` | Configure those in `backend/.env`. The simulated path is intentional for demos. |
| Sign-up "succeeds" but login fails immediately after | Server validation rejected the password — but signup-then-login is chained client-side | Check Network tab; backend returns the validation message |
| "Demo self-approve" 401s | JWT expired (7-day TTL) or cleared | Re-login from `/auth` |

---

## Companion repo

For backend setup, smart-contract deployment, EIP-712 typed-data spec, and the full REST API reference, see [AbdulNasir-NuZ/ReDi-web3](https://github.com/AbdulNasir-NuZ/ReDi-web3).

---

## License

UNLICENSED — proprietary, internal use only.
