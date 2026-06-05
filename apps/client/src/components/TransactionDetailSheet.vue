<template>
  <f7-sheet
    v-model:opened="isOpened"
    style="height: auto; --f7-sheet-bg-color: var(--fintr-bg-card); border-radius: 24px 24px 0 0"
    swipe-to-close
    backdrop
  >
    <div class="sheet-modal-inner" style="padding: 24px 20px; color: var(--fintr-text)">
      <!-- Handlebar for swipe to close indicator -->
      <div
        style="
          width: 40px;
          height: 5px;
          background: var(--fintr-border);
          border-radius: 3px;
          margin: -12px auto 16px auto;
        "
      ></div>

      <div v-if="transaction">
        <!-- Header -->
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
          "
        >
          <div>
            <div
              style="
                font-size: 20px;
                font-weight: 800;
                color: var(--fintr-primary);
                margin-bottom: 4px;
              "
            >
              {{ transaction.merchant || "Transaksi Pengeluaran" }}
            </div>
            <div style="font-size: 12px; color: var(--fintr-text-dim); font-weight: 500">
              {{ formatDate(transaction.transactionAt) }}
            </div>
          </div>
          <!-- Badge Source -->
          <div
            style="
              font-size: 11px;
              padding: 4px 10px;
              border-radius: 100px;
              font-weight: 700;
              background: var(--fintr-bg-card-hover);
              color: var(--fintr-primary);
              display: flex;
              align-items: center;
              gap: 4px;
            "
          >
            {{ getSourceIcon(transaction.source) }} {{ getSourceLabel(transaction.source) }}
          </div>
        </div>

        <!-- Amount & Envelope Card -->
        <div
          style="
            background: rgba(15, 82, 56, 0.04);
            border: 1px solid var(--fintr-border);
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <div>
            <div
              style="
                font-size: 11px;
                color: var(--fintr-text-dim);
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 4px;
              "
            >
              Jumlah
            </div>
            <div
              class="font-headline"
              style="font-size: 24px; font-weight: 900; color: var(--fintr-primary)"
            >
              Rp {{ formatRp(transaction.amount) }}
            </div>
          </div>
          <div style="text-align: right">
            <div
              style="
                font-size: 11px;
                color: var(--fintr-text-dim);
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 4px;
              "
            >
              Kategori Amplop
            </div>
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px">
              <span
                :style="{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: transaction.envelopeColor || 'var(--fintr-primary)',
                }"
              ></span>
              <span style="font-weight: 700; font-size: 14px; color: var(--fintr-text)">
                {{ transaction.envelopeName || "Amplop" }}
              </span>
            </div>
          </div>
        </div>

        <!-- Notes / Receipt Items Details -->
        <div>
          <div
            style="
              font-size: 13px;
              color: var(--fintr-text-dim);
              font-weight: 700;
              margin-bottom: 8px;
            "
          >
            Catatan / Rincian Struk
          </div>
          <div
            v-if="transaction.note"
            style="
              background: var(--fintr-bg-card-hover);
              border-radius: 12px;
              padding: 16px;
              font-size: 14px;
              line-height: 1.6;
              white-space: pre-line;
              max-height: 250px;
              overflow-y: auto;
              color: var(--fintr-text);
              border: 1px solid var(--fintr-border);
            "
          >
            {{ transaction.note }}
          </div>
          <div
            v-else
            style="
              font-size: 13px;
              color: var(--fintr-text-dim);
              font-style: italic;
              text-align: center;
              padding: 16px;
              background: var(--fintr-bg-card-hover);
              border-radius: 12px;
              border: 1px dashed var(--fintr-border);
            "
          >
            Tidak ada catatan transaksi.
          </div>
        </div>

        <!-- Foto Struk Belanja -->
        <div v-if="transaction.rawImageKey" style="margin-top: 16px">
          <div
            style="
              font-size: 13px;
              color: var(--fintr-text-dim);
              font-weight: 700;
              margin-bottom: 8px;
            "
          >
            Foto Struk Belanja
          </div>
          <div
            @click="openReceiptFull(transaction.rawImageKey)"
            style="
              position: relative;
              border-radius: 12px;
              overflow: hidden;
              border: 1px solid var(--fintr-border);
              background: var(--fintr-bg-card-hover);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 120px;
              transition: all 0.2s ease;
            "
          >
            <!-- Background blurred version of the receipt image -->
            <div
              :style="{
                backgroundImage: `url(${getAssetUrl(transaction.rawImageKey)})`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(8px) brightness(0.6)',
                zIndex: 1,
              }"
            ></div>
            <!-- Main foreground preview image -->
            <img
              :src="getAssetUrl(transaction.rawImageKey)"
              alt="Pratinjau Struk"
              style="
                max-height: 100%;
                max-width: 100%;
                object-fit: contain;
                position: relative;
                z-index: 2;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              "
            />
            <!-- Click to expand label overlay -->
            <div
              style="
                position: absolute;
                bottom: 6px;
                right: 8px;
                background: rgba(0, 0, 0, 0.6);
                color: #fff;
                font-size: 10px;
                font-weight: 700;
                padding: 3px 8px;
                border-radius: 100px;
                z-index: 3;
                display: flex;
                align-items: center;
                gap: 4px;
              "
            >
              <span>🔍 Perbesar</span>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div style="display: flex; gap: 12px; margin-top: 24px; width: 100%">
          <button
            @click="confirmDelete"
            class="font-headline"
            style="
              flex: 1;
              background: #ffebeb;
              color: #d32f2f;
              border: 1px solid #ffcdd2;
              padding: 14px;
              border-radius: 12px;
              font-weight: 700;
              font-size: 15px;
              cursor: pointer;
              transition: all 0.2s;
            "
          >
            Hapus Transaksi
          </button>
          <button
            @click="isOpened = false"
            class="btn-primary font-headline"
            style="
              flex: 1;
              border: none;
              padding: 14px;
              border-radius: 12px;
              font-weight: 700;
              font-size: 15px;
              cursor: pointer;
            "
          >
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  </f7-sheet>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { f7Sheet, f7 } from "framework7-vue";
import { getAssetUrl } from "../js/api";

const props = defineProps<{
  opened: boolean;
  transaction: any;
}>();

const emit = defineEmits<{
  (e: "update:opened", val: boolean): void;
  (e: "delete", id: string): void;
}>();

const isOpened = computed({
  get: () => props.opened,
  set: (val: boolean) => emit("update:opened", val),
});

const openReceiptFull = (key: string) => {
  window.open(getAssetUrl(key), "_blank");
};

const confirmDelete = () => {
  if (!props.transaction) return;
  f7.dialog.confirm("Apakah Anda yakin ingin menghapus transaksi ini?", "Konfirmasi Hapus", () => {
    isOpened.value = false;
    emit("delete", props.transaction.id);
  });
};

const formatRp = (num: number | string) => {
  const parsed = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(parsed)) return "0";
  return parsed.toLocaleString("id-ID");
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getSourceIcon = (source?: string) => {
  if (source === "ocr") return "📷";
  if (source === "share") return "📱";
  return "✍️";
};

const getSourceLabel = (source?: string) => {
  if (source === "ocr") return "Scan Struk";
  if (source === "share") return "Shared PWA";
  return "Input Manual";
};
</script>
