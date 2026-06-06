<template>
  <div class="card-glass animate-in" style="margin-bottom: 20px; padding: 20px">
    <div style="font-size: 15px; font-weight: 700; margin-bottom: 8px">Rumah Tangga</div>
    <div style="font-size: 13px; color: var(--fintr-text-muted); margin-bottom: 16px">
      Bagikan kode undangan ini kepada pasanganmu agar dapat mengelola amplop anggaran bersama.
    </div>

    <div
      v-if="inviteCode"
      style="
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--fintr-border);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        font-size: 24px;
        font-weight: 800;
        letter-spacing: 2px;
        color: var(--f7-theme-color-tint);
        margin-bottom: 16px;
      "
    >
      {{ inviteCode }}
    </div>

    <!-- Daftar Anggota Rumah Tangga -->
    <div v-if="members && members.length > 0" style="margin-bottom: 20px">
      <div
        style="
          font-size: 13px;
          font-weight: 700;
          color: var(--fintr-text-muted);
          margin-bottom: 10px;
        "
      >
        Anggota Terhubung:
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px">
        <div
          v-for="member in members"
          :key="member.userId"
          style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--fintr-border);
            border-radius: 12px;
            padding: 10px 14px;
          "
        >
          <div style="display: flex; align-items: center; gap: 10px">
            <div
              style="
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 1px solid var(--fintr-border);
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >
              <img
                v-if="member.avatarUrl"
                :src="getAssetUrl(member.avatarUrl)"
                style="width: 100%; height: 100%; object-fit: cover"
                alt="Avatar"
              />
              <div
                v-else
                style="
                  width: 100%;
                  height: 100%;
                  background: #0f5238;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                  font-weight: bold;
                  color: white;
                "
              >
                {{ member.name ? member.name.charAt(0).toUpperCase() : "M" }}
              </div>
            </div>
            <div>
              <div style="font-size: 13px; font-weight: 700">{{ member.name }}</div>
              <div style="font-size: 11px; color: var(--fintr-text-muted)">
                {{ member.email }}
              </div>
            </div>
          </div>
          <div
            style="
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              background: rgba(255, 255, 255, 0.05);
              padding: 2px 8px;
              border-radius: 6px;
              color: var(--fintr-text-muted);
            "
          >
            {{ member.role === "owner" ? "Owner" : "Anggota" }}
          </div>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 16px">
      <div style="font-size: 13px; color: var(--fintr-text-muted); margin-bottom: 6px">
        Gabung Rumah Tangga Pasangan (Gunakan Kode Undangan)
      </div>
      <div style="display: flex; gap: 8px">
        <input
          type="text"
          class="fintr-input"
          v-model="joinCode"
          placeholder="e.g. A1B2C3"
          style="text-transform: uppercase"
        />
        <button
          class="btn-primary"
          style="width: auto; padding: 12px 20px"
          :disabled="joining"
          @click="submitJoin"
        >
          {{ joining ? "..." : "Gabung" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { getAssetUrl } from "../../js/api";

defineProps<{
  inviteCode: string;
  members: any[];
  joining: boolean;
}>();

const emit = defineEmits<{
  (e: "join", code: string): void;
}>();

const joinCode = ref("");

const submitJoin = () => {
  emit("join", joinCode.value);
};
</script>
