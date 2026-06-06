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

      <!-- Rollover Preview Sheet Modal -->
      <f7-sheet
        class="rollover-sheet"
        style="
          height: auto;
          --f7-sheet-bg-color: var(--fintr-bg-dark);
          border-radius: 20px 20px 0 0;
          border-top: 1px solid var(--fintr-border);
        "
        :opened="showRolloverSheet"
        @sheet:closed="showRolloverSheet = false"
        backdrop
      >
        <div style="padding: 20px 20px 32px 20px; color: var(--fintr-text)">
          <!-- Drag handle -->
          <div
            style="
              width: 36px;
              height: 4px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 2px;
              margin: 0 auto 16px auto;
            "
          ></div>

          <div
            style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 20px;
            "
          >
            <div>
              <div style="font-size: 18px; font-weight: 800; color: var(--fintr-text)">
                Pratinjau Rollover
              </div>
              <div style="font-size: 13px; color: var(--fintr-text-muted)">
                Evaluasi keuangan sebelum menutup periode
              </div>
            </div>
            <button
              @click="showRolloverSheet = false"
              style="
                background: rgba(255, 255, 255, 0.05);
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--fintr-text);
              "
            >
              <span class="material-symbols-outlined" style="font-size: 18px">close</span>
            </button>
          </div>

          <div v-if="loadingPreview" style="text-align: center; padding: 32px 0">
            <f7-preloader size="28"></f7-preloader>
            <div style="margin-top: 12px; font-size: 13px; color: var(--fintr-text-muted)">
              Menganalisis sisa anggaran...
            </div>
          </div>

          <div v-else-if="previewData">
            <!-- Smart Insights Summary Card -->
            <div
              class="card-glass animate-in"
              style="margin-bottom: 20px; padding: 16px; background: rgba(255, 255, 255, 0.02)"
            >
              <div
                style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  margin-bottom: 12px;
                  color: var(--f7-theme-color-tint);
                "
              >
                <span class="material-symbols-outlined" style="font-size: 20px">insights</span>
                <span
                  style="
                    font-size: 13px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  "
                >
                  Smart Insights
                </span>
              </div>

              <div
                style="
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 12px;
                  margin-bottom: 16px;
                "
              >
                <div
                  style="
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid var(--fintr-border);
                    border-radius: 12px;
                    padding: 10px;
                  "
                >
                  <div style="font-size: 11px; color: var(--fintr-text-muted)">Akan Ditabung</div>
                  <div
                    style="
                      font-size: 16px;
                      font-weight: 800;
                      color: var(--fintr-success);
                      margin-top: 2px;
                    "
                  >
                    {{ formatRp(previewSummary.toSavings) }}
                  </div>
                </div>
                <div
                  style="
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid var(--fintr-border);
                    border-radius: 12px;
                    padding: 10px;
                  "
                >
                  <div style="font-size: 11px; color: var(--fintr-text-muted)">Tetap di Amplop</div>
                  <div
                    style="
                      font-size: 16px;
                      font-weight: 800;
                      color: var(--f7-theme-color-tint);
                      margin-top: 2px;
                    "
                  >
                    {{ formatRp(previewSummary.toSelf) }}
                  </div>
                </div>
              </div>

              <!-- Alert warning for reset amount > 0 -->
              <div
                v-if="previewSummary.toReset > 0"
                style="
                  display: flex;
                  gap: 10px;
                  background: rgba(239, 68, 68, 0.08);
                  border: 1px solid rgba(239, 68, 68, 0.2);
                  border-radius: 12px;
                  padding: 12px;
                  margin-bottom: 12px;
                "
              >
                <span
                  class="material-symbols-outlined"
                  style="color: var(--fintr-danger); font-size: 20px"
                  >warning</span
                >
                <div style="font-size: 12px; line-height: 1.5; color: var(--fintr-text)">
                  Ada sisa dana sebesar
                  <strong style="color: var(--fintr-danger)">{{
                    formatRp(previewSummary.toReset)
                  }}</strong>
                  yang diatur untuk <strong>Reset ke Nol</strong> (akan hangus). Kamu bisa mengubah
                  perilaku rollover di edit amplop agar sisa dana tidak hangus.
                </div>
              </div>

              <div
                style="
                  font-size: 12px;
                  line-height: 1.5;
                  color: var(--fintr-text-muted);
                  display: flex;
                  gap: 8px;
                  align-items: flex-start;
                "
              >
                <span
                  class="material-symbols-outlined"
                  style="font-size: 16px; color: var(--f7-theme-color-tint)"
                  >info</span
                >
                <span>
                  Total sisa anggaran terkumpul:
                  <strong>{{ formatRp(previewSummary.totalRemaining) }}</strong> dari
                  <strong>{{ previewData.allocations.length }} amplop</strong>.
                </span>
              </div>
            </div>

            <!-- Envelope Rollover Preview List -->
            <div
              style="
                font-size: 13px;
                font-weight: 700;
                color: var(--fintr-text-muted);
                margin-bottom: 10px;
              "
            >
              Daftar Rincian Amplop:
            </div>

            <div
              style="
                max-height: 240px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 24px;
                padding-right: 4px;
              "
            >
              <div
                v-for="alloc in previewData.allocations"
                :key="alloc.id"
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
                    :style="{ background: alloc.envelopeColor || '#94a3b8' }"
                    style="width: 10px; height: 10px; border-radius: 50%"
                  ></div>
                  <div>
                    <div style="font-size: 13px; font-weight: 700">{{ alloc.envelopeName }}</div>
                    <div style="font-size: 11px; color: var(--fintr-text-muted); margin-top: 1px">
                      Sisa: {{ formatRp(parseFloat(alloc.remaining)) }}
                    </div>
                  </div>
                </div>

                <!-- Destination Info Badge -->
                <div style="text-align: right">
                  <span
                    v-if="alloc.rolloverBehavior === 'rollover_to_savings'"
                    style="
                      font-size: 10px;
                      font-weight: 700;
                      background: rgba(16, 185, 129, 0.1);
                      color: var(--fintr-success);
                      padding: 2px 8px;
                      border-radius: 6px;
                      border: 1px solid rgba(16, 185, 129, 0.2);
                    "
                  >
                    Pindah ke Tabungan
                  </span>
                  <span
                    v-else-if="alloc.rolloverBehavior === 'rollover_self'"
                    style="
                      font-size: 10px;
                      font-weight: 700;
                      background: rgba(59, 130, 246, 0.1);
                      color: var(--f7-theme-color-tint);
                      padding: 2px 8px;
                      border-radius: 6px;
                      border: 1px solid rgba(59, 130, 246, 0.2);
                    "
                  >
                    Tetap di Amplop
                  </span>
                  <span
                    v-else
                    style="
                      font-size: 10px;
                      font-weight: 700;
                      background: rgba(239, 68, 68, 0.1);
                      color: var(--fintr-danger);
                      padding: 2px 8px;
                      border-radius: 6px;
                      border: 1px solid rgba(239, 68, 68, 0.2);
                    "
                  >
                    Reset ke Nol
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
              <button
                class="btn-primary"
                style="
                  background: rgba(255, 255, 255, 0.05);
                  color: var(--fintr-text);
                  border: 1px solid var(--fintr-border);
                  box-shadow: none;
                "
                @click="showRolloverSheet = false"
              >
                Batal
              </button>
              <button
                class="btn-primary"
                style="
                  background: linear-gradient(135deg, var(--fintr-warning), var(--fintr-danger));
                "
                :disabled="closingPeriod"
                @click="confirmClosePeriod"
              >
                {{ closingPeriod ? "Memproses..." : "Tutup Periode 🔁" }}
              </button>
            </div>
          </div>
        </div>
      </f7-sheet>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { f7Page, f7Navbar, f7Preloader, f7Sheet, f7 } from "framework7-vue";
import { household, auth, periods, getUser, clearToken, getAssetUrl } from "../js/api";
import { MONTH_NAMES, formatRp } from "../js/routes";

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
    const res: any = await auth.joinHousehold(joinCode.value.trim().toUpperCase());
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
            const res: any = await auth.joinHousehold(joinCode.value.trim().toUpperCase(), true);
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

const confirmClosePeriod = async () => {
  closingPeriod.value = true;
  try {
    await periods.close(activePeriod.value.id);
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
