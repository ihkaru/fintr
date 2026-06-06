<template>
  <f7-sheet
    :opened="opened"
    @sheet:closed="$emit('update:opened', false)"
    style="
      height: auto;
      --f7-sheet-bg-color: #ffffff;
      border-radius: 20px 20px 0 0;
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
    "
    backdrop
  >
    <div style="padding: 20px 20px 32px 20px; color: #161a32">
      <!-- Drag handle -->
      <div
        style="
          width: 36px;
          height: 4px;
          background: #bfc9c1;
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
          <div style="font-size: 18px; font-weight: 800; color: #161a32">
            ⚠️ Tinjau Transaksi Gagal
          </div>
          <div style="font-size: 13px; color: #707973; margin-top: 4px">
            Transaksi offline berikut gagal disimpan karena masalah validasi data.
          </div>
        </div>
        <button
          @click="$emit('update:opened', false)"
          style="
            background: #f0f2f0;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #161a32;
            cursor: pointer;
          "
        >
          <span class="material-symbols-outlined" style="font-size: 18px">close</span>
        </button>
      </div>

      <!-- Transaction List -->
      <div
        style="
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        "
      >
        <div
          v-for="item in failedQueue"
          :key="item.id"
          style="border: 1px solid #bfc9c1; border-radius: 12px; padding: 12px; background: #fafafa"
        >
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 6px;
            "
          >
            <div>
              <div style="font-size: 14px; font-weight: 700; color: #161a32">
                {{ item.data.merchant || "Share Target Offline" }}
              </div>
              <div style="font-size: 11px; color: #707973">
                {{ new Date(item.createdAt).toLocaleString("id-ID") }}
              </div>
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #161a32">
              Rp {{ formatRp(item.data.amount || getSplitTotal(item.data)) }}
            </div>
          </div>

          <!-- Error Alert -->
          <div
            style="
              background: #fdf2f2;
              border-radius: 6px;
              padding: 8px;
              font-size: 12px;
              color: #c81e1e;
              margin-bottom: 12px;
              line-height: 1.4;
              font-family:
                system-ui,
                -apple-system,
                sans-serif;
            "
          >
            {{ friendlyError(item.errorMessage) }}
          </div>

          <!-- Action buttons -->
          <div style="display: flex; gap: 8px; justify-content: flex-end">
            <button
              @click="$emit('remove', item.id)"
              style="
                background: transparent;
                color: #e02424;
                border: 1px solid #f8b4b4;
                border-radius: 6px;
                padding: 6px 12px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
              "
            >
              Hapus
            </button>
            <button
              @click="$emit('retry', item.id)"
              style="
                background: #0f5238;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 6px 12px;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
              "
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>

      <button
        @click="$emit('clearAll')"
        style="
          width: 100%;
          background: #fdf2f2;
          color: #e02424;
          border: 1px solid #f8b4b4;
          padding: 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        "
      >
        Hapus Semua Riwayat Gagal
      </button>
    </div>
  </f7-sheet>
</template>

<script setup lang="ts">
import { f7Sheet } from "framework7-vue";
import { formatRp } from "../js/routes";

defineProps<{
  opened: boolean;
  failedQueue: any[];
  friendlyError: (msg?: string) => string;
  getSplitTotal: (data: any) => number;
}>();

defineEmits<{
  (e: "update:opened", val: boolean): void;
  (e: "remove", id: string): void;
  (e: "retry", id: string): void;
  (e: "clearAll"): void;
}>();
</script>
