<template>
  <f7-page name="settings">
    <f7-navbar title="Pengaturan"></f7-navbar>

    <div v-if="loading" style="text-align: center; padding: 48px">
      <f7-preloader size="42"></f7-preloader>
      <div style="margin-top: 16px; color: var(--fintr-text-muted)">
        Memuat detail pengaturan...
      </div>
    </div>

    <div v-else style="padding: 16px">
      <!-- User Profile Card -->
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
            :src="userProfile.avatarUrl"
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

      <!-- Household / Invite Code Card -->
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
                    :src="member.avatarUrl"
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
              @click="joinHousehold"
            >
              {{ joining ? "..." : "Gabung" }}
            </button>
          </div>
        </div>
      </div>

      <!-- Period / Rollover Operations Card -->
      <div class="card-glass animate-in" style="margin-bottom: 20px; padding: 20px">
        <div style="font-size: 15px; font-weight: 700; margin-bottom: 8px">Manajemen Periode</div>
        <div style="font-size: 13px; color: var(--fintr-text-muted); margin-bottom: 16px">
          Menutup periode akan memicu sisa dana di semua amplop dialokasikan kembali sesuai
          pengaturan rollover, dan membuka periode baru secara otomatis.
        </div>

        <div v-if="activePeriod" style="margin-bottom: 16px">
          <div style="font-size: 13px; color: var(--fintr-text-muted); margin-bottom: 4px">
            Periode Aktif Saat Ini:
          </div>
          <div style="font-size: 16px; font-weight: 700">
            {{ MONTH_NAMES[activePeriod.month] }} {{ activePeriod.year }}
          </div>
        </div>

        <button
          class="btn-primary"
          style="background: linear-gradient(135deg, var(--fintr-warning), var(--fintr-danger))"
          :disabled="closingPeriod"
          @click="closeActivePeriod"
        >
          {{ closingPeriod ? "Memproses Rollover..." : "Tutup Periode & Rollover 🔁" }}
        </button>
      </div>

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
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { f7Page, f7Navbar, f7Preloader, f7 } from "framework7-vue";
import { household, auth, periods, getUser, clearToken } from "../js/api";
import { MONTH_NAMES } from "../js/routes";

declare const __APP_VERSION__: string;
const appVersion = __APP_VERSION__;

const loading = ref(true);
const joining = ref(false);
const closingPeriod = ref(false);

const userProfile = ref<any>(null);
const inviteCode = ref("");
const joinCode = ref("");
const activePeriod = ref<any>(null);
const userAvatarError = ref(false);
const members = ref<any[]>([]);

const loadSettings = async () => {
  try {
    userAvatarError.value = false;
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

const joinHousehold = async () => {
  if (!joinCode.value.trim()) {
    f7.dialog.alert("Masukkan kode undangan", "Oops");
    return;
  }

  joining.value = true;
  try {
    await auth.joinHousehold(joinCode.value.trim().toUpperCase());
    f7.dialog.alert(
      "Berhasil bergabung ke rumah tangga baru! Silakan login ulang untuk sinkronisasi.",
      "Sukses",
      () => {
        handleLogout();
      }
    );
  } catch (err: any) {
    f7.dialog.alert("Gagal bergabung: " + err.message);
  } finally {
    joining.value = false;
  }
};

const closeActivePeriod = () => {
  if (!activePeriod.value) {
    f7.dialog.alert("Tidak ada periode aktif yang bisa ditutup.", "Oops");
    return;
  }

  f7.dialog.confirm(
    `Apakah kamu yakin ingin menutup periode ${MONTH_NAMES[activePeriod.value.month]} ${activePeriod.value.year}? Sisa dana di setiap amplop akan di-rollover otomatis.`,
    "Tutup Periode",
    async () => {
      closingPeriod.value = true;
      try {
        await periods.close(activePeriod.value.id);
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
    }
  );
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
