<template>
  <div>
    <!-- Section Header -->
    <DashboardSectionHeader
      title="Amplop Anggaran Pasangan"
      @click-link="$emit('switch-tab', '#view-envelopes')"
    />

    <!-- Empty State -->
    <div
      v-if="allocationsData.length === 0"
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
      <div style="font-size: 48px; margin-bottom: 16px">📦</div>
      <div style="font-size: 15px; font-weight: 700; color: #161a32; margin-bottom: 8px">
        Belum Ada Amplop Aktif
      </div>
      <div style="font-size: 12px; color: #707973; margin-bottom: 20px; line-height: 1.6">
        Amplop digunakan untuk membagi anggaran belanja rumah tangga ke pos-pos tertentu agar
        pengeluaran terkendali bersama pasangan.
      </div>
      <f7-link
        @click="$emit('switch-tab', '#view-envelopes')"
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
        Buat Amplop Pertama
      </f7-link>
    </div>

    <!-- Grid List -->
    <div v-else class="envelope-grid" style="padding: 0 16px">
      <EnvelopeCard
        v-for="(a, idx) in allocationsData"
        :key="a.id"
        :allocation="a"
        :delay="idx * 0.05"
        :is-highlighted="updatedAllocationIds?.includes(a.id)"
        @click="$emit('select-envelope', a.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { f7Link } from "framework7-vue";
import DashboardSectionHeader from "./DashboardSectionHeader.vue";
import EnvelopeCard from "./EnvelopeCard.vue";

defineProps<{
  allocationsData: any[];
  updatedAllocationIds?: string[];
}>();

defineEmits<{
  (e: "switch-tab", tabId: string): void;
  (e: "select-envelope", id: string): void;
}>();
</script>
