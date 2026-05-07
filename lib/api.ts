export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000';

export type KycStatus = 'pending' | 'approved' | 'rejected' | 'not_submitted';
export type NftStatus = 'minted' | 'pending' | 'not_minted';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown network error';
    throw new Error(`Cannot reach backend at ${API_BASE_URL}. ${message}`);
  }

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const message =
      (data as { message?: string | string[] } | null)?.message ||
      `Request failed with status ${response.status}`;

    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  return data as T;
}

async function multipart<T>(
  path: string,
  form: FormData,
  token: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const message =
      (data as { message?: string | string[] } | null)?.message ||
      `Request failed with status ${response.status}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
  return data as T;
}

// Backwards-compatible thin wrapper for existing call sites that still use the
// old `apiRequest('/path', { method, body, headers })` signature. Prefer the
// typed `api.*` helpers below for new code.
export type ApiError = { message: string; status?: number };

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const method = (init.method ?? 'GET') as RequestOptions['method'];
  const body =
    typeof init.body === 'string'
      ? (JSON.parse(init.body) as unknown)
      : init.body instanceof FormData
        ? undefined
        : init.body;

  if (init.body instanceof FormData) {
    if (!token) throw new Error('Multipart requests require an auth token');
    return multipart<T>(path, init.body, token);
  }

  return request<T>(path, { method, body, token });
}

export type AuthResponse = {
  accessToken: string;
  user: { id: string; email: string };
  demo?: boolean;
};

export type CompanyResponse = {
  id: string;
  name: string;
  description: string;
  founderId: string;
  industry: string | null;
  country: string | null;
  logoUrl: string | null;
  ipfsUri: string | null;
  isLegal: boolean;
  registrationNo: string | null;
  legalUpgradeTx: string | null;
  foundedAt: string | null;
  mintedAt: string | null;
  nftTokenId: string | null;
  status: string;
  createdAt: string;
};

export type WalletChallenge = {
  message: string;
  nonce: string;
  expiresAt: string;
};

export type Eip712TypedData = {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  value: Record<string, unknown>;
};

export type MintPreparedPayload = {
  tokenURI: string;
  nonce: string;
  deadline: number;
  eip712: Eip712TypedData;
};

export type MintReceipt = {
  transactionHash: string;
  tokenId: string;
  tokenURI: string;
  mintId: string;
  contractAddress: string;
  chainId: string | null;
  simulated?: boolean;
};

export type CertificateResponse = {
  companyId: string;
  companyName: string;
  tokenId: string;
  transactionHash: string;
  contractAddress: string;
  chainId: string | null;
  polygonscanUrl: string;
  tokenUrl: string;
  ipfsUri: string;
  ipfsGatewayUrl: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    external_url: string;
    attributes: Array<{ trait_type: string; value: string | number | boolean; display_type?: string }>;
  } | null;
  mintedAt: string | null;
  simulated?: boolean;
  isLegal: boolean;
  registrationNo: string | null;
  legalUpgradeTx: string | null;
  legalUpgradeUrl: string | null;
  founderAddress: string;
};

export type LegalUpgradeReceipt = {
  companyId: string;
  tokenId: string | null;
  isLegal: boolean;
  registrationNo: string | null;
  ipfsUri: string;
  transactionHash: string;
  simulated: boolean;
};

export const api = {
  // ─── Auth ─────────────────────────────────────────────────────────────
  signup: (payload: { email: string; password: string }) =>
    request<{ message: string; userId: string }>('/auth/signup', {
      method: 'POST',
      body: payload,
    }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: payload }),

  loginDemo: () => request<AuthResponse>('/auth/demo-login', { method: 'POST' }),

  getDemoAccount: () =>
    request<{ email: string; password: string }>('/auth/demo-account'),

  // ─── KYC ──────────────────────────────────────────────────────────────
  selfApproveKyc: (token: string) =>
    request<{ id: string; email: string; kycStatus: string; kycDocumentUrl: string | null }>(
      '/kyc/self-approve',
      { method: 'POST', token },
    ),

  uploadKycDocument: (token: string, file: File) => {
    const form = new FormData();
    form.append('document', file);
    return multipart<{ id: string; kycStatus: string; kycDocumentUrl: string }>(
      '/kyc/upload',
      form,
      token,
    );
  },

  // ─── Company ──────────────────────────────────────────────────────────
  createCompany: (
    token: string,
    payload: { name: string; description: string; industry?: string; country?: string },
  ) =>
    request<CompanyResponse>('/company/create', {
      method: 'POST',
      token,
      body: payload,
    }),

  getMyCompanies: (token: string) =>
    request<CompanyResponse[]>('/company', { token }),

  getCompany: (token: string, companyId: string) =>
    request<CompanyResponse>(`/company/${companyId}`, { token }),

  uploadLogo: (token: string, companyId: string, file: File) => {
    const form = new FormData();
    form.append('logo', file);
    return multipart<{ logoUrl: string }>(`/company/${companyId}/logo`, form, token);
  },

  getCertificate: (companyId: string) =>
    request<CertificateResponse>(`/company/${companyId}/certificate`),

  getCertificateByTokenId: (tokenId: string) =>
    request<CertificateResponse>(`/company/by-token/${tokenId}`),

  // ─── Wallet (SIWE-style ownership challenge) ──────────────────────────
  walletChallenge: (token: string, walletAddress: string) =>
    request<WalletChallenge>('/web3/wallet/challenge', {
      method: 'POST',
      token,
      body: { walletAddress },
    }),

  walletVerify: (
    token: string,
    payload: { walletAddress: string; message: string; signature: string },
  ) =>
    request<{ id: string; email: string; walletAddress: string; walletLinkedAt: string }>(
      '/web3/wallet/verify',
      { method: 'POST', token, body: payload },
    ),

  // ─── Mint (two-step: prepare → sign → commit) ─────────────────────────
  prepareMint: (token: string, companyId: string) =>
    request<MintPreparedPayload>('/web3/mint/prepare', {
      method: 'POST',
      token,
      body: { companyId },
    }),

  commitMint: (
    token: string,
    payload: { companyId: string; signature: string; nonce: string },
  ) => request<MintReceipt>('/web3/mint', { method: 'POST', token, body: payload }),

  upgradeLegal: (
    token: string,
    payload: { companyId: string; registrationNo: string; legalName?: string; foundedAt?: string },
  ) =>
    request<LegalUpgradeReceipt>('/web3/upgrade-legal', {
      method: 'POST',
      token,
      body: payload,
    }),

  walletDisconnect: (token: string) =>
    request<{ id: string; email: string; walletAddress: string | null }>('/web3/wallet', {
      method: 'DELETE',
      token,
    }),
};
