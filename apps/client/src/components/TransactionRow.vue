<template>
  <div
    class="txn-item animate-in txn-row-clickable"
    @click="$emit('click')"
    style="
      background: white;
      border: 1px solid #bfc9c1;
      border-radius: 16px;
      padding: 14px 16px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: space-between;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    "
  >
    <div style="display: flex; align-items: center; gap: 12px; flex: 1">
      <div
        class="icon-circle"
        :style="{
          background: `${transaction.envelopeColor}16`,
          color: transaction.envelopeColor,
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          flexShrink: 0,
        }"
      >
        <span
          style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
          "
        >
          {{ transaction.source === "ocr" ? "📷" : transaction.source === "share" ? "📱" : "✍️" }}
        </span>
      </div>
      <div class="info" style="display: flex; flex-direction: column; gap: 2px">
        <div class="merchant" style="font-weight: 700; color: #161a32; font-size: 14px">
          {{ transaction.merchant || transaction.note || "Belanja" }}
        </div>
        <div class="meta" style="font-size: 11px; color: #707973">
          {{ formattedDate }}
          <span
            v-if="transaction.source === 'ocr' || transaction.source === 'share'"
            style="
              background: rgba(15, 82, 56, 0.08);
              color: #0f5238;
              padding: 1px 6px;
              border-radius: 6px;
              font-size: 9px;
              font-weight: bold;
              margin-left: 4px;
              display: inline-flex;
              align-items: center;
              gap: 2px;
            "
          >
            <span class="material-symbols-outlined" style="font-size: 10px">receipt_long</span>
            Via Struk
          </span>
        </div>
      </div>
    </div>
    <div class="amount-col" style="text-align: right">
      <div class="amount font-headline" style="font-weight: 800; color: #ba1a1a; font-size: 14px">
        -{{ formatRp(parseFloat(transaction.amount)) }}
      </div>
      <div
        class="envelope-tag"
        style="
          font-size: 10px;
          color: #707973;
          background: #f3f1e9;
          padding: 2px 8px;
          border-radius: 12px;
          margin-top: 4px;
          display: inline-block;
        "
      >
        {{ transaction.envelopeName }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatRp } from "../js/routes";

interface Transaction {
  id: string;
  amount: string;
  merchant?: string | null;
  note?: string | null;
  source: string;
  envelopeName: string;
  envelopeColor: string;
  transactionAt: string;
}

const props = defineProps<{
  transaction: Transaction;
}>();

defineEmits<{
  (e: "click"): void;
}>();

const formattedDate = computed(() => {
  const date = new Date(props.transaction.transactionAt);
  return (
    date.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) +
    " · " +
    date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );
});
</script>

<style scoped>
.animate-in {
  animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.txn-row-clickable:hover {
  background: var(--fintr-bg-card-hover) !important;
  border-color: var(--fintr-primary) !important;
}
.txn-row-clickable:active {
  transform: scale(0.98);
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
