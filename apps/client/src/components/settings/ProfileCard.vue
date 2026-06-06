<template>
  <div
    class="card-glass animate-in"
    style="margin-bottom: 20px; display: flex; align-items: center; gap: 16px"
  >
    <div
      style="
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: 2px solid var(--fintr-border);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      "
    >
      <img
        v-if="userProfile?.avatarUrl && !userAvatarError"
        :src="getAssetUrl(userProfile.avatarUrl)"
        @error="userAvatarError = true"
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
          font-size: 20px;
          font-weight: bold;
          color: white;
        "
      >
        {{ userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : "S" }}
      </div>
    </div>
    <div>
      <div style="font-size: 16px; font-weight: 700">{{ userProfile?.name }}</div>
      <div style="font-size: 13px; color: var(--fintr-text-muted)">
        {{ userProfile?.email }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { getAssetUrl } from "../../js/api";

defineProps<{
  userProfile: any;
}>();

const userAvatarError = ref(false);
</script>
