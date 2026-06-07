<template>
  <f7-page name="envelopes" @page:beforein="onPageShow" @page:tabshow="onPageShow">
    <f7-navbar title="Kelola Amplop">
      <f7-nav-right>
        <f7-link icon-only @click="openCreateSheet">
          <span
            class="material-symbols-outlined"
            style="font-size: 24px; color: var(--fintr-primary)"
            >add</span
          >
        </f7-link>
      </f7-nav-right>
    </f7-navbar>

    <div v-if="loading" style="text-align: center; padding: 48px">
      <f7-preloader size="42"></f7-preloader>
      <div style="margin-top: 16px; color: var(--fintr-text-muted)">Memuat data amplop...</div>
    </div>

    <div v-else :key="renderKey" class="animate-in">
      <!-- Info Alert Box -->
      <div
        style="
          margin: 16px;
          padding: 14px 16px;
          background: #eef7f4;
          border: 1px solid #c2e5d9;
          border-radius: 12px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        "
      >
        <span
          class="material-symbols-outlined"
          style="color: #0f5238; font-size: 20px; margin-top: 2px; flex-shrink: 0"
          >info</span
        >
        <div style="font-size: 12px; color: #1e3d30; line-height: 1.5">
          <strong style="font-weight: 700; display: block; margin-bottom: 2px"
            >Template Anggaran Rumah Tangga</strong
          >
          Daftar ini adalah template default bulanan. Perubahan (tambah, ubah, hapus) di sini hanya
          berlaku untuk Rumah Tangga kamu (tersinkronisasi dengan pasangan) dan tidak akan mengubah
          data/transaksi periode sebelumnya.
        </div>
      </div>

      <div class="block-title">Amplop Aktif (Template Bulanan)</div>
      <div
        v-if="items.length === 0"
        class="empty-state"
        style="
          margin: 16px;
          background: white;
          border: 1px solid #bfc9c1;
          border-radius: 16px;
          padding: 32px;
          text-align: center;
        "
      >
        <div style="font-size: 48px; margin-bottom: 16px">✉️</div>
        <div style="font-size: 15px; font-weight: 700; color: #161a32; margin-bottom: 8px">
          Belum Ada Template Amplop
        </div>
        <div style="font-size: 12px; color: #707973; margin-bottom: 20px; line-height: 1.6">
          Buat template master amplop anggaran bulanan Anda di sini. Template ini akan otomatis
          disalin setiap kali periode baru dimulai.
        </div>
        <f7-link
          @click="openCreateSheet"
          style="
            display: inline-block;
            font-size: 13px;
            font-weight: 700;
            color: white;
            background: #0f5238;
            padding: 10px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(15, 82, 56, 0.2);
          "
        >
          ➕ Buat Template Pertama
        </f7-link>
      </div>

      <f7-list v-else media-list class="no-margin envelopes-list-group">
        <f7-list-item
          v-for="item in items"
          :key="item.id"
          swipeout
          link="#"
          @click="openEditSheet(item)"
          class="envelope-card-item"
        >
          <template #media>
            <div
              style="
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 44px;
                height: 44px;
                margin-top: 4px;
              "
            >
              <!-- Circle container -->
              <div
                :style="{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: `${item.color}1c`,
                  border: `1.5px solid ${item.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                }"
              >
                {{ getEnvelopeEmoji(item.name) }}
              </div>
              <!-- Savings target indicator overlay -->
              <div
                v-if="item.isSavingsTarget"
                style="
                  position: absolute;
                  bottom: -4px;
                  right: -4px;
                  width: 18px;
                  height: 18px;
                  background: #ffffff;
                  border: 1.5px solid #22c55e;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
                  font-size: 10px;
                "
                title="Target Tabungan"
              >
                🏦
              </div>
            </div>
          </template>

          <template #title>
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
              "
            >
              <span style="font-size: 15px; font-weight: 700; color: #1e293b">
                {{ item.name }}
              </span>
              <!-- Inline badge if savings target -->
              <span
                v-if="item.isSavingsTarget"
                style="
                  font-size: 9px;
                  font-weight: 800;
                  color: #15803d;
                  background: #dcfce7;
                  border: 1px solid #bbf7d0;
                  border-radius: 6px;
                  padding: 2px 6px;
                  white-space: nowrap;
                  text-transform: uppercase;
                  letter-spacing: 0.3px;
                "
              >
                Target Tabungan
              </span>
            </div>
          </template>

          <template #subtitle>
            <div style="font-size: 13px; font-weight: 500; color: #64748b; margin-top: 4px">
              Alokasi Default:
              <span style="font-weight: 800; color: #0f5238">{{
                formatRp(item.defaultAmount)
              }}</span>
            </div>
          </template>

          <template #text>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 6px">
              <span
                style="
                  font-size: 10px;
                  color: #94a3b8;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                "
                >Rollover:</span
              >
              <span
                :style="{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background:
                    item.rolloverBehavior === 'rollover_self'
                      ? '#eef5f0'
                      : item.rolloverBehavior === 'rollover_to_savings'
                        ? '#eff6ff'
                        : '#f1f5f9',
                  color:
                    item.rolloverBehavior === 'rollover_self'
                      ? '#0f5238'
                      : item.rolloverBehavior === 'rollover_to_savings'
                        ? '#1d4ed8'
                        : '#475569',
                  border:
                    item.rolloverBehavior === 'rollover_self'
                      ? '1px solid rgba(15, 82, 56, 0.15)'
                      : item.rolloverBehavior === 'rollover_to_savings'
                        ? '1px solid rgba(29, 78, 216, 0.15)'
                        : '1px solid rgba(71, 85, 105, 0.15)',
                }"
              >
                {{ getRolloverLabel(item.rolloverBehavior) }}
              </span>
            </div>
          </template>

          <f7-swipeout-actions right>
            <f7-swipeout-button color="blue" @click.stop="openEditSheet(item)">
              Ubah
            </f7-swipeout-button>
            <f7-swipeout-button
              delete
              confirm-text="Hapus template amplop ini?"
              @click.stop="deleteEnvelope(item)"
            >
              Hapus
            </f7-swipeout-button>
          </f7-swipeout-actions>
        </f7-list-item>
      </f7-list>
    </div>

    <!-- Create/Edit Sheet Modal -->
    <f7-sheet
      v-model:opened="sheetOpened"
      style="height: auto; --f7-sheet-bg-color: var(--fintr-bg-card)"
      swipe-to-close
      backdrop
    >
      <div class="sheet-modal-inner" style="padding: 24px 16px">
        <div style="font-size: 18px; font-weight: 700; margin-bottom: 16px">
          {{ isEditing ? "Ubah Detail Amplop" : "Tambah Amplop Baru" }}
        </div>

        <div style="margin-bottom: 16px">
          <div style="font-size: 13px; color: var(--fintr-text-muted); margin-bottom: 6px">
            Nama Amplop
          </div>
          <input
            type="text"
            class="fintr-input"
            v-model="form.name"
            placeholder="e.g. Belanja Mingguan, Uang Kos, Listrik"
          />
        </div>

        <div style="margin-bottom: 16px">
          <div style="font-size: 13px; color: var(--fintr-text-muted); margin-bottom: 6px">
            Alokasi Bulanan Default
          </div>
          <input
            type="number"
            class="fintr-input"
            v-model="form.defaultAmount"
            placeholder="e.g. 500000"
          />
        </div>

        <div style="margin-bottom: 16px">
          <div style="font-size: 13px; color: var(--fintr-text-muted); margin-bottom: 8px">
            Warna Amplop
          </div>
          <div style="display: flex; gap: 8px; overflow-x: auto; padding: 6px 4px; margin: 0 -4px">
            <span
              v-for="color in colorPresets"
              :key="color"
              @click="form.color = color"
              :style="{
                display: 'inline-block',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: color,
                cursor: 'pointer',
                border: '3px solid var(--fintr-bg-card)',
                boxShadow: form.color === color ? '0 0 0 2px var(--fintr-primary)' : 'none',
                transform: form.color === color ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
              }"
            ></span>
          </div>
        </div>

        <div style="margin-bottom: 16px">
          <div style="font-size: 13px; color: var(--fintr-text-muted); margin-bottom: 6px">
            Perilaku Sisa Dana (Rollover)
          </div>
          <select class="fintr-input" v-model="form.rolloverBehavior">
            <option value="reset">Reset (Kembali Nol)</option>
            <option value="rollover_self">Rollover (Biarkan menumpuk)</option>
            <option value="rollover_to_savings">Transfer ke Tabungan</option>
          </select>
        </div>

        <!-- Savings target section (edit mode only) -->
        <div v-if="isEditing" style="margin-bottom: 24px">
          <!-- Case 1: This envelope IS the current savings target -->
          <div
            v-if="editingItem?.isSavingsTarget"
            style="
              padding: 12px 14px;
              background: #f0fdf4;
              border: 1px solid #86efac;
              border-radius: 10px;
              display: flex;
              align-items: flex-start;
              gap: 10px;
            "
          >
            <span
              class="material-symbols-outlined"
              style="font-size: 20px; color: #16a34a; flex-shrink: 0; margin-top: 1px"
              >savings</span
            >
            <div>
              <div style="font-size: 13px; font-weight: 700; color: #166534">
                Ini adalah Target Tabungan aktif
              </div>
              <div style="font-size: 11px; color: #4d7c5f; margin-top: 3px; line-height: 1.5">
                Semua amplop dengan rollover <em>"Transfer ke Tabungan"</em> akan mengirimkan
                sisanya ke sini setiap pergantian periode. Untuk memindahkan peran ini, buka amplop
                lain dan jadikan sebagai target baru.
              </div>
            </div>
          </div>

          <!-- Case 2: Another envelope is the savings target → offer to switch -->
          <div
            v-else-if="currentSavingsTarget"
            style="
              padding: 12px 14px;
              background: #fafafa;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
            "
          >
            <div style="font-size: 12px; color: #64748b; margin-bottom: 8px">
              Target tabungan saat ini:
              <span
                style="
                  display: inline-flex;
                  align-items: center;
                  gap: 4px;
                  font-weight: 700;
                  color: #166534;
                  background: #dcfce7;
                  border: 1px solid #86efac;
                  border-radius: 999px;
                  padding: 1px 8px;
                  font-size: 12px;
                "
              >
                <span
                  :style="{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: currentSavingsTarget.color,
                  }"
                ></span>
                {{ currentSavingsTarget.name }}
              </span>
            </div>
            <button
              type="button"
              @click="promptSetAsSavingsTarget"
              style="
                width: 100%;
                padding: 9px 14px;
                background: white;
                border: 1.5px solid #22c55e;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                color: #166534;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
              "
            >
              <span class="material-symbols-outlined" style="font-size: 16px">swap_horiz</span>
              Pindahkan target ke amplop ini
            </button>
          </div>

          <!-- Case 3: No savings target exists yet -->
          <div
            v-else
            style="
              padding: 12px 14px;
              background: #fefce8;
              border: 1px solid #fde047;
              border-radius: 10px;
            "
          >
            <div style="font-size: 12px; color: #713f12; margin-bottom: 8px; line-height: 1.4">
              ⚠️ Belum ada target tabungan. Amplop dengan rollover
              <em>"Transfer ke Tabungan"</em> tidak punya tujuan pengiriman dana.
            </div>
            <button
              type="button"
              @click="promptSetAsSavingsTarget"
              style="
                width: 100%;
                padding: 9px 14px;
                background: #fef9c3;
                border: 1.5px solid #eab308;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                color: #713f12;
                cursor: pointer;
              "
            >
              🏦 Jadikan amplop ini sebagai target tabungan
            </button>
          </div>
        </div>

        <div v-else style="margin-bottom: 24px"></div>

        <button class="btn-primary" :disabled="creating" @click="saveEnvelope">
          {{ creating ? "Memproses..." : isEditing ? "Simpan Perubahan" : "Buat Amplop" }}
        </button>
      </div>
    </f7-sheet>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import {
  f7Page,
  f7Navbar,
  f7NavRight,
  f7Link,
  f7Preloader,
  f7List,
  f7ListItem,
  f7SwipeoutActions,
  f7SwipeoutButton,
  f7Sheet,
  f7,
} from "framework7-vue";
import { envelopes } from "../js/api";
import { formatRp } from "../js/routes";
import { getEnvelopeEmoji } from "../js/utils/emoji";

const loading = ref(true);
const creating = ref(false);
const sheetOpened = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const items = ref<any[]>([]);

const colorPresets = [
  "#6366f1", // Indigo
  "#ec4899", // Pink
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#8b5cf6", // Purple
  "#ef4444", // Red
  "#14b8a6", // Teal
];

const form = reactive({
  name: "",
  defaultAmount: "" as number | "",
  color: colorPresets[0],
  rolloverBehavior: "reset",
});

// Derived: which envelope is currently the savings target
const currentSavingsTarget = computed(() => items.value.find(i => i.isSavingsTarget) ?? null);

const loadEnvelopes = async () => {
  try {
    const list = await envelopes.list();
    items.value = list;
  } catch (err: any) {
    f7.dialog.alert("Gagal memuat amplop: " + err.message);
  } finally {
    loading.value = false;
  }
};

const getRolloverLabel = (val: string) => {
  if (val === "reset") return "Kembali Nol (Reset)";
  if (val === "rollover_self") return "Menumpuk (Rollover)";
  if (val === "rollover_to_savings") return "Transfer ke Tabungan";
  return val;
};

const openCreateSheet = () => {
  isEditing.value = false;
  editingId.value = null;
  form.name = "";
  form.defaultAmount = "";
  form.color = colorPresets[0];
  form.rolloverBehavior = "reset";
  sheetOpened.value = true;
};

const editingItem = ref<any>(null);

const openEditSheet = (item: any) => {
  isEditing.value = true;
  editingId.value = item.id;
  editingItem.value = item;
  form.name = item.name;
  form.defaultAmount = Number(item.defaultAmount);
  form.color = item.color || colorPresets[0];
  form.rolloverBehavior = item.rolloverBehavior || "reset";
  sheetOpened.value = true;
};

// Prompt user to confirm switching savings target
const promptSetAsSavingsTarget = () => {
  const old = currentSavingsTarget.value;
  const msg = old
    ? `Saat ini <strong>${old.name}</strong> adalah target tabungan.<br><br>Apakah kamu ingin memindahkannya ke <strong>${form.name || editingItem.value?.name}</strong>? Dana rollover bulan depan akan dikirim ke amplop ini.`
    : `Jadikan <strong>${form.name || editingItem.value?.name}</strong> sebagai target tabungan? Dana sisa dari semua amplop berperilaku "Transfer ke Tabungan" akan dikirim ke sini setiap akhir periode.`;

  f7.dialog.confirm(msg, "Konfirmasi Target Tabungan", async () => {
    try {
      await envelopes.setSavingsTarget(editingId.value!);
      f7.toast.create({ text: "Target tabungan diperbarui 🏦", closeTimeout: 2000 }).open();
      sheetOpened.value = false;
      loadEnvelopes();
    } catch (err: any) {
      f7.dialog.alert("Gagal memperbarui target tabungan: " + err.message);
    }
  });
};

const submitSaveEnvelope = async () => {
  creating.value = true;
  try {
    if (isEditing.value && editingId.value) {
      await envelopes.update(editingId.value, {
        name: form.name,
        defaultAmount: Number(form.defaultAmount),
        color: form.color,
        rolloverBehavior: form.rolloverBehavior,
        // isSavingsTarget is handled separately via promptSetAsSavingsTarget
      });
      f7.toast
        .create({
          text: "Detail amplop diperbarui! ✉️",
          closeTimeout: 2000,
        })
        .open();
    } else {
      await envelopes.create({
        name: form.name,
        defaultAmount: Number(form.defaultAmount),
        color: form.color,
        rolloverBehavior: form.rolloverBehavior,
      });
      f7.toast
        .create({
          text: "Amplop baru dibuat! ✉️",
          closeTimeout: 2000,
        })
        .open();
    }
    sheetOpened.value = false;
    loadEnvelopes();
  } catch (err: any) {
    f7.dialog.alert("Gagal menyimpan amplop: " + err.message);
  } finally {
    creating.value = false;
  }
};

const saveEnvelope = async () => {
  if (!form.name.trim()) {
    f7.dialog.alert("Masukkan nama amplop", "Oops");
    return;
  }
  if (form.defaultAmount === "" || form.defaultAmount <= 0) {
    f7.dialog.alert("Masukkan jumlah default yang valid", "Oops");
    return;
  }

  // Pre-action preview confirmation for Scenario B
  if (isEditing.value && editingId.value && editingItem.value) {
    const oldAmount = Number(editingItem.value.defaultAmount);
    const newAmount = Number(form.defaultAmount);
    if (oldAmount !== newAmount) {
      f7.dialog.confirm(
        `Anda mengubah nominal anggaran dari <strong>${formatRp(oldAmount)}</strong> menjadi <strong>${formatRp(newAmount)}</strong>.<br><br>` +
          `Perubahan ini akan memperbarui alokasi anggaran periode berjalan secara retroaktif.<br><br>` +
          `Apakah Anda ingin melanjutkan?`,
        "Konfirmasi Edit Anggaran",
        async () => {
          await submitSaveEnvelope();
        }
      );
      return;
    }
  }

  await submitSaveEnvelope();
};

const deleteEnvelope = async (item: any) => {
  try {
    const res: any = await envelopes.remove(item.id);
    items.value = items.value.filter(i => i.id !== item.id);
    if (res?.keptInActivePeriod) {
      f7.dialog.alert(
        "Amplop dinonaktifkan dari daftar master. Karena sudah ada transaksi tercatat pada periode ini, amplop akan tetap muncul dengan status 'Ditutup' di halaman utama hingga periode berakhir.",
        "Amplop Dinonaktifkan"
      );
    } else {
      f7.toast
        .create({
          text: "Amplop berhasil dihapus",
          closeTimeout: 2000,
        })
        .open();
    }
  } catch (err: any) {
    // Handle savings target dependency error specifically
    if (
      err?.error === "SAVINGS_TARGET_HAS_DEPENDENTS" ||
      err?.message?.includes("SAVINGS_TARGET_HAS_DEPENDENTS")
    ) {
      f7.dialog.alert(
        `<strong>${item.name}</strong> adalah amplop target tabungan yang sedang digunakan oleh amplop lain.<br><br>` +
          `Untuk menghapusnya, lakukan salah satu:<br>` +
          `• Ubah perilaku rollover semua amplop "Transfer ke Tabungan" menjadi pilihan lain, <em>atau</em><br>` +
          `• Jadikan amplop lain sebagai target tabungan terlebih dahulu (via tombol Ubah).`,
        "Tidak Dapat Dihapus 🏦"
      );
    } else {
      f7.dialog.alert("Gagal menghapus: " + (err?.message || JSON.stringify(err)));
    }
  }
};

const renderKey = ref(0);
const onPageShow = () => {
  renderKey.value++;
  loadEnvelopes();
};

onMounted(() => {
  window.addEventListener("fintr:envelope-changed", loadEnvelopes);
});

onUnmounted(() => {
  window.removeEventListener("fintr:envelope-changed", loadEnvelopes);
});
</script>

<style scoped>
.envelopes-list-group {
  margin-top: 8px !important;
}

/* Deep select list component to remove default borders and background */
:deep(.envelopes-list-group ul) {
  background: transparent !important;
  border: none !important;
  margin: 0 !important;
  padding: 16px !important;
}

:deep(.envelopes-list-group ul::before),
:deep(.envelopes-list-group ul::after) {
  display: none !important;
}

/* Custom rounded card styling for list items */
.envelope-card-item {
  background: #ffffff !important;
  border: 1px solid var(--fintr-border-color, #e2e8f0) !important;
  border-radius: 16px !important;
  margin-bottom: 12px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02) !important;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
  overflow: hidden;
}

.envelope-card-item:hover {
  border-color: var(--fintr-primary, #0f5238) !important;
  box-shadow: 0 6px 16px rgba(15, 82, 56, 0.05) !important;
  transform: translateY(-1px);
}

.envelope-card-item:active {
  transform: scale(0.99);
}

/* Reset inner item content default borders and paddings */
:deep(.envelope-card-item .item-content) {
  padding-left: 14px !important;
  padding-right: 14px !important;
  min-height: 80px !important;
}

:deep(.envelope-card-item .item-inner) {
  border-bottom: none !important;
  padding-top: 14px !important;
  padding-bottom: 14px !important;
}

:deep(.envelope-card-item .item-inner::after) {
  display: none !important;
}
</style>
