<template>
  <div>
    <!-- History title -->
    <div
      class="block-title font-headline animate-in"
      style="margin: 16px 0 8px; font-size: 15px; font-weight: 800; color: #161a32"
    >
      Riwayat Snapshot Saldo
    </div>

    <!-- Empty state -->
    <div
      v-if="historyList.length === 0"
      class="empty-state animate-in"
      style="
        margin: 0 16px 16px;
        background: white;
        border: 1px solid #bfc9c1;
        border-radius: 16px;
        padding: 32px;
        text-align: center;
      "
    >
      <div style="font-size: 48px; margin-bottom: 16px">📊</div>
      <div style="font-size: 15px; font-weight: 700; color: #161a32; margin-bottom: 8px">
        Belum Ada Riwayat Rekonsiliasi
      </div>
      <div style="font-size: 12px; color: #707973; line-height: 1.6">
        Rekonsiliasi saldo mencocokkan jumlah uang riil Anda (di dompet/rekening) dengan saldo
        digital di aplikasi. Lakukan secara berkala untuk menjaga akurasi catatan keuangan.
      </div>
    </div>

    <!-- History items -->
    <div v-else style="display: flex; flex-direction: column; gap: 12px" class="animate-in">
      <div
        v-for="h in historyList"
        :key="h.id"
        @click="$emit('toggle-expand-snapshot', h.id)"
        style="
          background: #ffffff;
          border: 1px solid #bfc9c1;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          transition: all 0.2s ease;
          cursor: pointer;
        "
        :style="{
          borderColor: expandedSnapshots[h.id] ? '#0f5238' : '#bfc9c1',
          background: expandedSnapshots[h.id] ? '#f8faf9' : '#ffffff',
        }"
      >
        <!-- Row Utama -->
        <div
          style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            width: 100%;
          "
        >
          <!-- Left: User Avatar Initials and Info -->
          <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0">
            <div
              style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #e8ede9;
                color: #0f5238;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 14px;
                flex-shrink: 0;
                border: 1.5px solid #0f5238;
                text-transform: uppercase;
                overflow: hidden;
              "
            >
              <img
                v-if="h.creatorAvatar"
                :src="h.creatorAvatar"
                style="width: 100%; height: 100%; object-fit: cover"
              />
              <span v-else>{{ h.creatorName ? h.creatorName.substring(0, 2) : "US" }}</span>
            </div>

            <div style="flex: 1; min-width: 0">
              <div
                style="
                  font-size: 15px;
                  font-weight: 700;
                  color: #161a32;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                "
              >
                {{ formatRp(h.actualBalance) }}
              </div>
              <div
                style="
                  font-size: 12px;
                  color: #707973;
                  margin-top: 2px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                "
                v-if="!expandedSnapshots[h.id]"
              >
                {{ h.note || "Snapshot Saldo" }}
              </div>
              <div
                style="font-size: 12px; color: #707973; margin-top: 2px; font-weight: 600"
                v-else-if="!parseNoteDetails(h.note)"
              >
                {{ h.note || "Snapshot Saldo" }}
              </div>
            </div>
          </div>

          <!-- Right: Date and Creator Badge -->
          <div
            style="
              text-align: right;
              flex-shrink: 0;
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              gap: 4px;
            "
          >
            <span
              style="
                font-size: 11px;
                color: #707973;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 4px;
              "
            >
              {{ formatDate(h.snapshotAt) }}
              <span
                class="material-symbols-outlined"
                style="font-size: 14px; transition: transform 0.2s"
                :style="{
                  transform: expandedSnapshots[h.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                }"
              >
                expand_more
              </span>
            </span>
            <div
              style="
                font-size: 10px;
                font-weight: 700;
                background: #f0f4f1;
                color: #0f5238;
                padding: 2px 8px;
                border-radius: 20px;
                border: 1px solid #c9d6cb;
                max-width: 100px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              "
            >
              👤 {{ h.creatorName || "Pengguna" }}
            </div>
          </div>
        </div>

        <!-- Bagian Detail Koin / Rincian Dompet (muncul saat di-expand) -->
        <div
          v-if="expandedSnapshots[h.id] && parseNoteDetails(h.note)"
          class="animate-in"
          style="
            margin-top: 4px;
            padding: 10px 12px;
            background: #f3f6f4;
            border-radius: 10px;
            border: 1px solid #c9d6cb;
            display: flex;
            flex-direction: column;
            gap: 6px;
          "
          @click.stop
        >
          <div
            style="
              font-size: 10px;
              font-weight: 700;
              color: #707973;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            "
          >
            Rincian Dompet Fisik
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px">
            <div
              v-for="(item, i) in parseNoteDetails(h.note)"
              :key="i"
              style="
                background: #ffffff;
                border: 1px solid #bfc9c1;
                padding: 4px 10px;
                border-radius: 8px;
                font-size: 11px;
                font-weight: 600;
                color: #161a32;
                display: flex;
                align-items: center;
                gap: 4px;
              "
            >
              <span style="color: #707973">{{ item.label }}:</span>
              <span style="color: #0f5238; font-weight: 700">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRp } from "../../js/routes";

defineProps<{
  historyList: any[];
  expandedSnapshots: Record<string, boolean>;
  parseNoteDetails: (note: string | null) => any[] | null;
  formatDate: (dateStr: string) => string;
}>();

defineEmits<{
  (e: "toggle-expand-snapshot", id: string): void;
}>();
</script>
