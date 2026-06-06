import { request } from "./client";

export const allocations = {
  async update(id: string, allocatedAmount: number) {
    return request(`/allocations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ allocatedAmount }),
    });
  },
};
