export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export type KycStatus = "pending" | "approved" | "rejected" | "not_submitted";
export type NftStatus = "minted" | "not_minted";

export type UserProfile = {
  email: string;
  walletAddress?: string;
  kycStatus?: KycStatus;
  nftStatus?: NftStatus;
};

export type ApiError = {
  message: string;
  status?: number;
};

async function safeJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(init.headers ?? {});

  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = await safeJson<{ message?: string | string[] }>(response);
    const rawMessage = payload?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : rawMessage || `Request failed (${response.status})`;

    throw {
      message,
      status: response.status,
    } as ApiError;
  }

  const data = await safeJson<T>(response);
  return (data ?? ({} as T));
}
