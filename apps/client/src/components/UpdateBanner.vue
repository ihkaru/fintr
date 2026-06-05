<template>
  <Transition name="update-slide">
    <div v-if="swUpdateAvailable" class="update-banner" @click="applyUpdate">
      <div class="update-banner-content">
        <span class="update-icon material-symbols-outlined">system_update</span>
        <div class="update-text">
          <div class="update-title">Versi baru tersedia!</div>
          <div class="update-subtitle">Ketuk untuk memperbarui sekarang</div>
        </div>
        <span class="update-action material-symbols-outlined">arrow_circle_up</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { swUpdateAvailable, applyUpdate } from "../composables/useAppUpdate";
</script>

<style scoped>
.update-banner {
  position: fixed;
  bottom: calc(64px + env(safe-area-inset-bottom, 0px));
  left: 12px;
  right: 12px;
  z-index: 9999;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.update-banner-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #0f5238, #1a7a54);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(15, 82, 56, 0.35),
    0 2px 8px rgba(0, 0, 0, 0.15);
  color: white;
  transition: transform 0.15s ease;
}

.update-banner-content:active {
  transform: scale(0.97);
}

.update-icon {
  font-size: 28px;
  font-variation-settings: "FILL" 1, "wght" 500;
  flex-shrink: 0;
  animation: pulse-glow 2s ease-in-out infinite;
}

.update-text {
  flex: 1;
  min-width: 0;
}

.update-title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.update-subtitle {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 1px;
}

.update-action {
  font-size: 24px;
  font-variation-settings: "FILL" 1, "wght" 500;
  flex-shrink: 0;
  opacity: 0.9;
}

/* Slide-up transition */
.update-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.update-slide-leave-active {
  transition: all 0.25s ease-in;
}

.update-slide-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.update-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
