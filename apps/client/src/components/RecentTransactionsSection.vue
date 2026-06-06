<template>
  <div>
    <!-- Section Header -->
    <DashboardSectionHeader
      title="Pengeluaran Terakhir"
      margin-top
      @click-link="$emit('switch-tab', '#view-transactions')"
    />

    <!-- Empty State -->
    <div
      v-if="recentTxns.length === 0"
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
      <div style="font-size: 48px; margin-bottom: 16px">💸</div>
      <div style="font-size: 15px; font-weight: 700; color: #161a32; margin-bottom: 8px">
        Belum Ada Transaksi
      </div>
      <div style="font-size: 12px; color: #707973; margin-bottom: 20px; line-height: 1.6">
        Setiap transaksi belanja bersama pasangan yang dicatat akan langsung memotong saldo amplop
        anggaran terkait.
      </div>
      <f7-link
        @click="$emit('add-transaction')"
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
        Catat Transaksi Pertama
      </f7-link>
    </div>

    <!-- Transaction List -->
    <div
      v-else
      class="recent-transactions-list"
      style="margin: 0 16px 16px; background: white; border-radius: 16px; overflow: hidden"
    >
      <TransactionRow
        v-for="t in recentTxns"
        :key="t.id"
        :transaction="t"
        @click="$emit('select-transaction', t)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { f7Link } from "framework7-vue";
import DashboardSectionHeader from "./DashboardSectionHeader.vue";
import TransactionRow from "./TransactionRow.vue";

defineProps<{
  recentTxns: any[];
}>();

defineEmits<{
  (e: "switch-tab", tabId: string): void;
  (e: "add-transaction"): void;
  (e: "select-transaction", txn: any): void;
}>();
</script>
