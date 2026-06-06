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
