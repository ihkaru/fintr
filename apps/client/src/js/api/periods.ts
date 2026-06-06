import { request } from "./client";

export interface PeriodDetail {
  period: {
    id: string;
    year: number;
    month: number;
    openingBalance: string | null;
    isClosed: boolean;
    createdAt?: string;
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
        createdAt?: string;
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

  async close(id: string, options?: { fastForward?: boolean }) {
    return request(`/periods/${id}/close`, {
      method: "POST",
      body: options ? JSON.stringify(options) : undefined,
    });
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
