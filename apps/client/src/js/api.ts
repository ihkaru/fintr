/**
 * API client wrapper for FinTr backend.
 * Handles JWT auth, error handling, and response parsing.
 */

export const API_BASE = (import.meta.env.VITE_API_URL as string) ?? "/api";

export function getAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }

  let cleanPath = path;
  if (cleanPath.startsWith("/api")) {
    cleanPath = cleanPath.slice(4);
  }
  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath;
  }

  return `${API_BASE}${cleanPath}`;
}

function getToken(): string | null {
  return localStorage.getItem("fintr_token");
}

import { ref } from "vue";

export const isLoggedInReactive = ref(isAuthenticated());

export function setToken(token: string) {
  localStorage.setItem("fintr_token", token);
  isLoggedInReactive.value = true;
}

export function clearToken() {
  localStorage.removeItem("fintr_token");
  isLoggedInReactive.value = false;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getUser(): { id: string; email: string; name: string; avatarUrl: string } | null {
  const raw = localStorage.getItem("fintr_user");
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user: { id: string; email: string; name: string; avatarUrl: string }) {
  localStorage.setItem("fintr_user", JSON.stringify(user));
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        const err = new Error(json.message || json.error || errorMessage);
        if (json.code) (err as any).code = json.code;
        if (json.details) (err as any).details = json.details;
        throw err;
      } else {
        errorMessage = await response.text();
      }
    } catch (e: any) {
      if (e.code || e.details) {
        throw e;
      }
      errorMessage = e.message || "Network error";
    }

    if (response.status === 401) {
      clearToken();
      localStorage.removeItem("fintr_user");
      // Redirect to login page
      window.location.href = "/";
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

// ── Auth ────────────────────────────────────────────────────────

export const auth = {
  async getConfig() {
    return request<{ googleClientId: string | null }>("/auth/config");
  },

  async loginWithGoogle(idToken: string) {
    return request<{
      token: string;
      user: { id: string; email: string; name: string; avatarUrl: string };
      household: { id: string; role: string } | null;
    }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  },

  async joinHousehold(inviteCode: string, forceDeleteTransactions?: boolean) {
    return request("/auth/join-household", {
      method: "POST",
      body: JSON.stringify({ inviteCode, forceDeleteTransactions }),
    });
  },
};

// ── Envelopes ───────────────────────────────────────────────────

export const envelopes = {
  async list() {
    return request<
      Array<{
        id: string;
        name: string;
        defaultAmount: string;
        rolloverBehavior: string;
        color: string;
        sortOrder: number;
      }>
    >("/envelopes");
  },

  async create(data: {
    name: string;
    defaultAmount: number;
    rolloverBehavior?: string;
    color?: string;
  }) {
    return request("/envelopes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    id: string,
    data: Partial<{ name: string; defaultAmount: number; rolloverBehavior: string; color: string }>
  ) {
    return request(`/envelopes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async remove(id: string) {
    return request(`/envelopes/${id}`, { method: "DELETE" });
  },
};

// ── Periods ─────────────────────────────────────────────────────

export interface PeriodDetail {
  period: {
    id: string;
    year: number;
    month: number;
    openingBalance: string | null;
    isClosed: boolean;
  };
  allocations: Array<{
    id: string;
    templateId: string;
    allocatedAmount: string;
    rolloverAmount: string;
    envelopeName: string;
    envelopeColor: string;
    rolloverBehavior: string;
    totalSpent: string;
    remaining: string;
    isActive?: boolean;
  }>;
  summary: {
    totalAllocated: string;
    totalSpent: string;
    totalRemaining: string;
  };
}

export const periods = {
  async list() {
    return request<
      Array<{
        id: string;
        year: number;
        month: number;
        isClosed: boolean;
        openingBalance: string | null;
      }>
    >("/periods");
  },

  async create(data: { year: number; month: number; openingBalance?: number }) {
    return request("/periods", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getDetail(id: string) {
    return request<PeriodDetail>(`/periods/${id}`);
  },

  async compare() {
    return request<{
      periods: Array<{
        id: string;
        year: number;
        month: number;
        name: string;
        totalAllocated: string;
        totalSpent: string;
        totalRemaining: string;
      }>;
      categories: Array<{
        name: string;
        color: string;
        history: Array<{
          periodId: string;
          allocated: string;
          spent: string;
        }>;
      }>;
    }>("/periods/compare");
  },

  async close(id: string) {
    return request(`/periods/${id}/close`, { method: "POST" });
  },

  async getRolloverLogs(id: string) {
    return request<
      Array<{
        id: string;
        householdId: string;
        fromPeriodId: string;
        toPeriodId: string;
        envelopeName: string;
        behavior: string;
        remainingAmount: string;
        rolledOverAmount: string;
        createdAt: string;
      }>
    >(`/periods/${id}/rollover-logs`);
  },
};

// ── Allocations ─────────────────────────────────────────────────

export const allocations = {
  async update(id: string, allocatedAmount: number) {
    return request(`/allocations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ allocatedAmount }),
    });
  },
};

// ── Transactions ────────────────────────────────────────────────

export interface Transaction {
  id: string;
  amount: string;
  merchant: string | null;
  note: string | null;
  transactionAt: string;
  source: string;
  createdBy: string;
  envelopeName: string;
  envelopeColor: string;
  rawImageKey?: string | null;
}

export const transactions = {
  async list(params: { periodId?: string; allocationId?: string; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.periodId) query.set("periodId", params.periodId);
    if (params.allocationId) query.set("allocationId", params.allocationId);
    if (params.limit) query.set("limit", params.limit.toString());
    return request<Transaction[]>(`/transactions?${query.toString()}`);
  },

  async create(data: {
    periodId: string;
    allocationId: string;
    amount: number;
    merchant?: string;
    note?: string;
    transactionAt: string;
    source?: string;
    rawImageKey?: string;
  }) {
    return request("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async createSplit(data: {
    transactions: Array<{
      periodId: string;
      allocationId: string;
      amount: number;
      merchant?: string;
      note?: string;
      transactionAt: string;
      source?: string;
      rawImageKey?: string;
    }>;
  }) {
    return request("/transactions/split", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async ocr(
    image: string,
    mimeType?: string,
    envelopes?: Array<{ id: string; name: string }>,
    onProgress?: (status: string) => void
  ) {
    const { jobId } = await request<{ jobId: string }>("/transactions/ocr", {
      method: "POST",
      body: JSON.stringify({ image, mimeType, envelopes }),
    });

    const poll = async (): Promise<{
      amount: number | null;
      merchant: string | null;
      date: string | null;
      rawText: string;
      confidence: "high" | "medium" | "low";
      recommendedEnvelopeId?: string | null;
      analysisReasoning?: string | null;
      receiptUrl?: string | null;
    }> => {
      const job = await request<{
        status: "pending" | "processing" | "completed" | "failed";
        result?: {
          amount: number | null;
          merchant: string | null;
          date: string | null;
          rawText: string;
          confidence: "high" | "medium" | "low";
          recommendedEnvelopeId?: string | null;
          analysisReasoning?: string | null;
          receiptUrl?: string | null;
        };
        error?: string;
      }>(`/transactions/ocr/status/${jobId}`);

      if (job.status === "completed" && job.result) {
        return job.result;
      }
      if (job.status === "failed") {
        throw new Error(job.error || "Ekstraksi OCR gagal");
      }

      if (onProgress) {
        if (job.status === "pending") {
          onProgress("Menunggu antrean...");
        } else if (job.status === "processing") {
          onProgress("Gemini sedang menganalisis gambar...");
        }
      }

      // Wait 1.5 seconds and poll again
      await new Promise(resolve => setTimeout(resolve, 1500));
      return poll();
    };

    return poll();
  },

  async parseText(text: string, envelopes?: Array<{ id: string; name: string }>) {
    return request<{
      amount: number | null;
      merchant: string | null;
      date: string | null;
      rawText: string;
      confidence: "high" | "medium" | "low";
      recommendedEnvelopeId?: string | null;
      analysisReasoning?: string | null;
      formattedNote?: string | null;
    }>("/transactions/parse-text", {
      method: "POST",
      body: JSON.stringify({ text, envelopes }),
    });
  },

  async update(
    id: string,
    data: Partial<{
      amount: number;
      merchant: string;
      note: string;
      allocationId: string;
      transactionAt: string;
      rawImageKey: string;
    }>
  ) {
    return request(`/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async remove(id: string) {
    return request(`/transactions/${id}`, { method: "DELETE" });
  },
};

// ── Reconcile ───────────────────────────────────────────────────

export const reconcile = {
  async snapshot(data: { actualBalance: number; note?: string }) {
    return request("/reconcile/snapshot", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async diff() {
    return request<{
      period: { year: number; month: number };
      openingBalance: string;
      totalSpent: string;
      expectedBalance: string;
      actualBalance: string | null;
      difference: string | null;
      lastSnapshot: unknown;
      status: string;
    }>("/reconcile/diff");
  },

  async history() {
    return request<
      Array<{
        id: string;
        actualBalance: string;
        note: string | null;
        snapshotAt: string;
      }>
    >("/reconcile/history");
  },
};

// ── Households ──────────────────────────────────────────────────

export interface HouseholdDetail {
  household: {
    id: string;
    name: string;
    inviteCode: string;
    createdAt: string;
  };
  members: Array<{
    userId: string;
    role: string;
    joinedAt: string;
    name: string;
    avatarUrl: string | null;
    email: string;
  }>;
}

export const household = {
  async get() {
    return request<HouseholdDetail>("/households");
  },

  async getInviteCode() {
    return request<{ inviteCode: string }>("/households/invite-code");
  },
};
