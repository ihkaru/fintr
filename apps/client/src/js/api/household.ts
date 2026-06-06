import { request } from "./client";

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
