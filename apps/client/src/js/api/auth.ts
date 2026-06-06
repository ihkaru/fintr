import { request } from "./client";

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
