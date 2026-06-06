import { request } from "./client";

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
        isSavingsTarget: boolean;
      }>
    >("/envelopes");
  },

  async create(data: {
    name: string;
    defaultAmount: number;
    rolloverBehavior?: string;
    color?: string;
  }) {
    return request<{
      id: string;
      name: string;
      defaultAmount: string;
      rolloverBehavior: string;
      color: string;
      isSavingsTarget: boolean;
    }>("/envelopes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      defaultAmount: number;
      rolloverBehavior: string;
      color: string;
      isSavingsTarget: boolean;
    }>
  ) {
    return request(`/envelopes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async setSavingsTarget(id: string) {
    return request(`/envelopes/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isSavingsTarget: true }),
    });
  },

  async remove(id: string) {
    return request(`/envelopes/${id}`, { method: "DELETE" });
  },
};
