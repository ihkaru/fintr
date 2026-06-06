<template>
  <f7-page name="settings">
    <f7-navbar title="Pengaturan"></f7-navbar>

    <!-- Fullscreen preloader when rollover is in progress -->
    <div
      v-if="closingPeriod"
      style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        color: white;
        text-align: center;
      "
    >
      <f7-preloader size="42" color="white"></f7-preloader>
      <div style="margin-top: 16px; font-weight: 600; font-size: 15px">
        Proses Tutup Periode & Rollover...
      </div>
      <div style="margin-top: 8px; font-size: 12px; opacity: 0.8; padding: 0 32px">
        Mohon tunggu, sistem sedang memproses sisa anggaran dan memindahkan alokasi.
      </div>
    </div>

    <div v-if="loading" style="text-align: center; padding: 48px">
      <f7-preloader size="42"></f7-preloader>
      <div style="margin-top: 16px; color: var(--fintr-text-muted)">
        Memuat detail pengaturan...
      </div>
    </div>

    <div v-else style="padding: 16px">
      <!-- User Profile Card -->
      <ProfileCard :user-profile="userProfile" />

      <!-- Household / Invite Code Card -->
      <HouseholdCard
        :invite-code="inviteCode"
        :members="members"
        :joining="joining"
        @join="joinHousehold"
      />

      <!-- Period / Rollover Operations Card -->
      <PeriodManagementCard
        :active-period="activePeriod"
        :closing-period="closingPeriod"
        @close-period="closeActivePeriod"
      />

      <!-- Logout Card -->
      <button
        class="btn-primary animate-in"
        style="
          background: rgba(239, 68, 68, 0.1);
          color: var(--fintr-danger);
          border: 1px solid rgba(239, 68, 68, 0.2);
          box-shadow: none;
        "
        @click="handleLogout"
      >
        Keluar Akun (Logout)
      </button>

      <!-- App Version & Update Link -->
      <div style="text-align: center; margin-top: 32px; padding-bottom: 24px">
        <div style="font-size: 12px; color: var(--fintr-text-dim); letter-spacing: 0.02em">
          FamiVault v{{ appVersion }}
        </div>
        <a
          href="https://github.com/ihkaru/fintr/releases"
          target="_blank"
          class="external"
          style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: var(--f7-theme-color-tint);
            margin-top: 8px;
            text-decoration: none;
            font-weight: 600;
          "
        >
          <span class="material-symbols-outlined" style="font-size: 14px">download</span>
          Unduh APK / Cek Update
        </a>
      </div>

      <!-- Rollover Preview Sheet Modal -->
      <RolloverPreviewSheet
        :opened="showRolloverSheet"
        :loading-preview="loadingPreview"
        :preview-data="previewData"
        :preview-summary="previewSummary"
        :closing-period="closingPeriod"
        :active-period="activePeriod"
        @closed="showRolloverSheet = false"
        @confirm="confirmClosePeriod"
      />
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { f7Page, f7Navbar, f7Preloader, f7 } from "framework7-vue";
import { household, auth, periods, getUser, clearToken } from "../js/api";

import ProfileCard from "../components/settings/ProfileCard.vue";
import HouseholdCard from "../components/settings/HouseholdCard.vue";
import PeriodManagementCard from "../components/settings/PeriodManagementCard.vue";
import RolloverPreviewSheet from "../components/settings/RolloverPreviewSheet.vue";

declare const __APP_VERSION__: string;
const appVersion = __APP_VERSION__;

const loading = ref(true);
const joining = ref(false);
const closingPeriod = ref(false);

const userProfile = ref<any>(null);
const inviteCode = ref("");
const activePeriod = ref<any>(null);
const members = ref<any[]>([]);

// Rollover Sheet States
const showRolloverSheet = ref(false);
const loadingPreview = ref(false);
const previewData = ref<any>(null);
const previewSummary = ref({
  totalRemaining: 0,
  toSavings: 0,
  toSelf: 0,
  toReset: 0,
});

const loadSettings = async () => {
  try {
    userProfile.value = getUser();
    const [inv, periodList, householdRes] = await Promise.all([
      household.getInviteCode(),
      periods.list(),
      household.get().catch(() => null),
    ]);

    inviteCode.value = inv.inviteCode;
    activePeriod.value = periodList.find(p => !p.isClosed);
    members.value = householdRes?.members || [];
  } catch (err: any) {
    console.error("Gagal memuat pengaturan:", err);
  } finally {
    loading.value = false;
  }
};

const joinHousehold = async (joinCodeValue: string) => {
  if (!joinCodeValue.trim()) {
    f7.dialog.alert("Masukkan kode undangan", "Oops");
    return;
  }

  joining.value = true;
  try {
    const res: any = await auth.joinHousehold(joinCodeValue.trim().toUpperCase());
    const householdName = res.household?.name || "keluarga baru";
    f7.dialog.alert(
      `Berhasil bergabung dengan ${householdName}! Anda sekarang berbagi anggaran dengan pasangan. Silakan login ulang untuk sinkronisasi periode aktif.`,
      "Sukses",
      () => {
        handleLogout();
      }
    );
  } catch (err: any) {
    if (err.code === "HOUSEHOLD_JOIN_BLOCKED_EXISTING_DATA") {
      const txCount = err.details?.existingTransactionsCount || 0;
      f7.dialog.confirm(
        `Anda memiliki <strong>${txCount} catatan transaksi</strong> di rumah tangga saat ini.<br><br>` +
          `Bergabung dengan rumah tangga baru akan <strong>menghapus seluruh catatan transaksi ini secara permanen</strong> dan memindahkan Anda ke periode aktif pasangan.<br><br>` +
          `Apakah Anda yakin ingin menghapus data lama dan bergabung?`,
        "Konfirmasi Hapus Transaksi & Join",
        async () => {
          joining.value = true;
          try {
            const res: any = await auth.joinHousehold(joinCodeValue.trim().toUpperCase(), true);
            const householdName = res.household?.name || "keluarga baru";
            f7.dialog.alert(
              `Berhasil menghapus data lama dan bergabung dengan ${householdName}! Silakan login ulang untuk sinkronisasi.`,
              "Sukses",
              () => {
                handleLogout();
              }
            );
          } catch (innerErr: any) {
            f7.dialog.alert("Gagal bergabung: " + innerErr.message);
          } finally {
            joining.value = false;
          }
        }
      );
    } else {
      f7.dialog.alert("Gagal bergabung: " + err.message);
    }
  } finally {
    joining.value = false;
  }
};

const closeActivePeriod = async () => {
  if (!activePeriod.value) {
    f7.dialog.alert("Tidak ada periode aktif yang bisa ditutup.", "Oops");
    return;
  }

  showRolloverSheet.value = true;
  loadingPreview.value = true;
  try {
    const res = await periods.getDetail(activePeriod.value.id);
    previewData.value = res;

    let totalRemaining = 0;
    let toSavings = 0;
    let toSelf = 0;
    let toReset = 0;

    res.allocations.forEach((alloc: any) => {
      const remaining = parseFloat(alloc.remaining) || 0;
      totalRemaining += remaining;
      if (alloc.rolloverBehavior === "rollover_to_savings") {
        toSavings += remaining;
      } else if (alloc.rolloverBehavior === "rollover_self") {
        toSelf += remaining;
      } else {
        toReset += remaining;
      }
    });

    previewSummary.value = {
      totalRemaining,
      toSavings,
      toSelf,
      toReset,
    };
  } catch (err: any) {
    f7.dialog.alert("Gagal memuat pratinjau rollover: " + err.message);
    showRolloverSheet.value = false;
  } finally {
    loadingPreview.value = false;
  }
};

const confirmClosePeriod = async (options: { fastForward: boolean }) => {
  closingPeriod.value = true;
  try {
    await periods.close(activePeriod.value.id, { fastForward: options.fastForward });
    showRolloverSheet.value = false;
    f7.dialog.alert(
      "Periode berhasil ditutup dan rollover selesai! Periode baru telah dibuka secara otomatis.",
      "Sukses"
    );
    loadSettings();
  } catch (err: any) {
    f7.dialog.alert("Gagal melakukan rollover: " + err.message);
  } finally {
    closingPeriod.value = false;
  }
};

const handleLogout = () => {
  clearToken();
  if (f7.views.main && f7.views.main.router) {
    f7.views.main.router.navigate("/login/", { reloadAll: true });
  }
};

onMounted(() => {
  loadSettings();
});
</script>
