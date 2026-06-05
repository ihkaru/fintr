<template>
  <f7-app v-bind="f7params">
    <!-- PWA Update Banner — shown when a new Service Worker is waiting -->
    <UpdateBanner />

    <!-- Main Views tabs when logged in -->
    <f7-views v-if="isLoggedIn" tabs class="safe-areas">
      <!-- Tabbar / Toolbar -->
      <f7-toolbar tabbar labels bottom class="bottom-nav-toolbar">
        <f7-link tab-link="#view-home" tab-link-active class="nav-link">
          <span class="material-symbols-outlined">home</span>
          <span class="tabbar-label">Dasbor</span>
        </f7-link>
        <f7-link tab-link="#view-transactions" class="nav-link">
          <span class="material-symbols-outlined">receipt_long</span>
          <span class="tabbar-label">Transaksi</span>
        </f7-link>
        <f7-link tab-link="#view-envelopes" class="nav-link">
          <span class="material-symbols-outlined">folder_open</span>
          <span class="tabbar-label">Amplop</span>
        </f7-link>
        <f7-link tab-link="#view-settings" class="nav-link">
          <span class="material-symbols-outlined">settings</span>
          <span class="tabbar-label">Pengaturan</span>
        </f7-link>
      </f7-toolbar>

      <!-- Views as Tab views -->
      <f7-view id="view-home" name="home" main tab tab-active url="/" />
      <f7-view id="view-transactions" name="transactions" tab url="/transactions/" />
      <f7-view id="view-envelopes" name="envelopes" tab url="/envelopes/" />
      <f7-view id="view-settings" name="settings" tab url="/settings/" />
    </f7-views>

    <!-- Single main view for Login screen when logged out -->
    <f7-view v-else main class="safe-areas" url="/login/" />
  </f7-app>
</template>

<script setup lang="ts">
import { f7App, f7Views, f7View, f7Toolbar, f7Link } from "framework7-vue";
import { routes } from "../js/routes";
import { isLoggedInReactive as isLoggedIn } from "../js/api";
import { watch } from "vue";
import { useSync } from "../composables/useSync";
import { useHardwareBack } from "../composables/useHardwareBack";
import UpdateBanner from "./UpdateBanner.vue";

const f7params = {
  name: "FamiVault",
  theme: "md",
  darkMode: false,
  routes,
};

// Initialize native hardware back button and app state listeners
useHardwareBack();

const { startSync, stopSync } = useSync();

watch(
  isLoggedIn,
  loggedIn => {
    if (loggedIn) {
      startSync();
    } else {
      stopSync();
    }
  },
  { immediate: true }
);
</script>

<style>
.bottom-nav-toolbar {
  --f7-toolbar-bg-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--fintr-border);
  height: calc(56px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.bottom-nav-toolbar .nav-link {
  color: var(--fintr-text-dim);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 0;
  transition:
    color 0.2s ease,
    transform 0.1s ease;
}

.bottom-nav-toolbar .nav-link:active {
  transform: scale(0.95);
}

.bottom-nav-toolbar .nav-link.tab-link-active {
  color: var(--fintr-primary) !important;
}

.bottom-nav-toolbar .material-symbols-outlined {
  font-size: 24px;
  margin-bottom: 2px;
  font-variation-settings:
    "FILL" 0,
    "wght" 400,
    "GRAD" 0,
    "opsz" 24;
}

.bottom-nav-toolbar .nav-link.tab-link-active .material-symbols-outlined {
  font-variation-settings:
    "FILL" 1,
    "wght" 600,
    "GRAD" 0,
    "opsz" 24;
}

.bottom-nav-toolbar .tabbar-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: -0.01em;
}
</style>
