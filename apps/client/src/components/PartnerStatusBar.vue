<template>
  <div
    style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px 8px;
      background: transparent;
    "
  >
    <div style="display: flex; align-items: center; gap: 10px">
      <!-- Dual overlapping avatars or single avatar -->
      <div
        style="position: relative; width: 42px; height: 32px; display: flex; align-items: center"
      >
        <!-- User Avatar -->
        <div
          style="
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            z-index: 2;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          <img
            v-if="userAvatar && !userAvatarError"
            :src="userAvatar"
            @error="userAvatarError = true"
            style="width: 100%; height: 100%; object-fit: cover"
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
              font-size: 11px;
              font-weight: bold;
              color: white;
            "
          >
            {{ user?.name ? user.name.charAt(0).toUpperCase() : "S" }}
          </div>
        </div>
        <!-- Partner Avatar -->
        <div
          v-if="partner"
          style="
            position: absolute;
            left: 16px;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            z-index: 1;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          <img
            v-if="partner.avatarUrl && !partnerAvatarError"
            :src="partner.avatarUrl"
            @error="partnerAvatarError = true"
            style="width: 100%; height: 100%; object-fit: cover"
          />
          <div
            v-else
            style="
              width: 100%;
              height: 100%;
              background: #485f84;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: bold;
              color: white;
            "
          >
            {{ partner.name ? partner.name.charAt(0).toUpperCase() : "P" }}
          </div>
        </div>
      </div>
      <div>
        <div style="font-size: 13px; font-weight: 700; color: #161a32; line-height: 1.2">
          {{ displayNames }}
        </div>
        <div style="font-size: 10px; color: #22c55e; display: flex; align-items: center; gap: 4px">
          <span
            :style="{
              width: '6px',
              height: '6px',
              background: partner ? '#22c55e' : '#707973',
              borderRadius: '50%',
              display: 'inline-block',
            }"
          ></span>
          {{ partner ? "Alokasi Saling Terhubung" : "Menunggu Partner..." }}
        </div>
      </div>
    </div>
    <div
      v-if="householdName"
      style="
        background: rgba(15, 82, 56, 0.08);
        border-radius: 12px;
        padding: 6px 12px;
        font-size: 11px;
        font-weight: 700;
        color: #0f5238;
      "
    >
      🏡 {{ householdName }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

interface UserProfile {
  name: string;
  avatarUrl?: string | null;
}

const props = defineProps<{
  user?: UserProfile | null;
  partner?: UserProfile | null;
  householdName?: string;
}>();

const userAvatarError = ref(false);
const partnerAvatarError = ref(false);

watch(
  () => props.user?.avatarUrl,
  () => {
    userAvatarError.value = false;
  }
);

watch(
  () => props.partner?.avatarUrl,
  () => {
    partnerAvatarError.value = false;
  }
);

const getFirstName = (fullName?: string) => {
  if (!fullName) return "";
  return fullName.split(" ")[0];
};

const displayNames = computed(() => {
  const meName = getFirstName(props.user?.name) || "Saya";
  if (props.partner?.name) {
    return `${meName} & ${getFirstName(props.partner.name)}`;
  }
  return meName;
});

const userAvatar = computed(() => {
  return props.user?.avatarUrl || "https://lh3.googleusercontent.com/a/default-user=s96-c";
});
</script>
