import { request } from "./client";

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
