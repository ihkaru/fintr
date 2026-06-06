<template>
  <f7-page name="envelopes" @page:beforein="loadEnvelopes" @page:tabshow="loadEnvelopes">
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

    <div v-else>
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
      <div v-if="items.length === 0" class="empty-state">
        <div class="icon">✉️</div>
        <div class="message">Belum ada amplop dibuat.</div>
      </div>

      <f7-list v-else media-list class="no-margin">
        <f7-list-item
          v-for="item in items"
          :key="item.id"
          :title="item.name"
          :subtitle="`Alokasi Default: ${formatRp(item.defaultAmount)}`"
          :text="`Rollover: ${getRolloverLabel(item.rolloverBehavior)}`"
          swipeout
          link="#"
          @click="openEditSheet(item)"
        >
          <template #media>
            <div
              :style="{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: item.color,
                marginTop: '12px',
              }"
            ></div>
          </template>

          <f7-swipeout-actions right>
            <f7-swipeout-button color="blue" @click.stop="openEditSheet(item)">
              Ubah
            </f7-swipeout-button>
            <f7-swipeout-button
              delete
              confirm-text="Hapus template amplop ini?"
              @click.stop="deleteEnvelope(item.id)"
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

        <div style="margin-bottom: 24px">
          <div style="font-size: 13px; color: var(--fintr-text-muted); margin-bottom: 6px">
            Perilaku Sisa Dana (Rollover)
          </div>
          <select class="fintr-input" v-model="form.rolloverBehavior">
            <option value="reset">Reset (Kembali Nol)</option>
            <option value="rollover_self">Rollover (Biarkan menumpuk)</option>
            <option value="rollover_to_savings">Transfer ke Tabungan</option>
          </select>
        </div>

        <button class="btn-primary" :disabled="creating" @click="saveEnvelope">
          {{ creating ? "Memproses..." : isEditing ? "Simpan Perubahan" : "Buat Amplop" }}
        </button>
      </div>
    </f7-sheet>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import {
  f7Page,
  f7Navbar,
  f7NavRight,
  f7Link,
  f7Icon,
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

const submitSaveEnvelope = async () => {
  creating.value = true;
  try {
    if (isEditing.value && editingId.value) {
      await envelopes.update(editingId.value, {
        name: form.name,
        defaultAmount: Number(form.defaultAmount),
        color: form.color,
        rolloverBehavior: form.rolloverBehavior,
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

const deleteEnvelope = async (id: string) => {
  try {
    const res: any = await envelopes.remove(id);
    items.value = items.value.filter(item => item.id !== id);
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
    f7.dialog.alert("Gagal menghapus: " + err.message);
  }
};

onMounted(() => {
  window.addEventListener("fintr:envelope-changed", loadEnvelopes);
});

onUnmounted(() => {
  window.removeEventListener("fintr:envelope-changed", loadEnvelopes);
});
</script>
