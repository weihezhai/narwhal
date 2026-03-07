import type { Strategy } from "@/data/mockData";
import { backendApiUrl } from "@/lib/backend";
import { getClientIdentityHeaders } from "@/lib/clientIdentity";

type StrategiesResponse = {
  strategies?: Strategy[];
  identity?: {
    ownerKey: string;
    ip: string;
    requestsToday: number;
    remaining: number;
  };
};

const request = async (path: string, init: RequestInit = {}) => {
  const url = backendApiUrl(path);
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...getClientIdentityHeaders(),
        ...(init.headers || {}),
      },
    });
  } catch (err: any) {
    throw new Error(`Failed to fetch @ ${url}${err?.message ? ` (${err.message})` : ""}`);
  }

  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        data?.message ||
        `Request failed: ${response.status} ${response.statusText} @ ${url}`,
    );
  }

  return data;
};

export const getIdentity = async () => {
  const data = (await request("/api/identity", { method: "GET" })) as {
    identity?: { ownerKey: string; ip: string; requestsToday: number; remaining: number };
  };
  return data.identity;
};

export const listStrategies = async (): Promise<StrategiesResponse> => {
  return (await request("/api/strategies", { method: "GET" })) as StrategiesResponse;
};

export const upsertStrategy = async (strategy: Strategy): Promise<Strategy> => {
  const data = (await request("/api/strategies", {
    method: "POST",
    body: JSON.stringify({ strategy }),
  })) as { strategy: Strategy };
  return data.strategy;
};

export const updateStrategy = async (id: string, patch: Partial<Strategy>): Promise<Strategy> => {
  const data = (await request(`/api/strategies/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ patch }),
  })) as { strategy: Strategy };
  return data.strategy;
};

export const deleteStrategy = async (id: string): Promise<void> => {
  await request(`/api/strategies/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
};
