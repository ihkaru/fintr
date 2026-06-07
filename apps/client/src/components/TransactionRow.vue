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
    <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0">
      <div
        class="icon-circle"
        :style="{
          position: 'relative',
          background: `${transaction.envelopeColor}16`,
          color: transaction.envelopeColor,
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
        }"
      >
        {{ getEnvelopeEmoji(transaction.envelopeName) }}
        <!-- Source Overlay Badge -->
        <div
          v-if="transaction.source === 'ocr' || transaction.source === 'share'"
          style="
            position: absolute;
            bottom: -3px;
            right: -3px;
            background: white;
            border: 1.5px solid #ffffff;
            border-radius: 50%;
            width: 14px;
            height: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
          "
        >
          {{ transaction.source === "ocr" ? "📷" : "📱" }}
        </div>
      </div>
      <div
        class="info"
        style="display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1"
      >
        <div
          class="merchant"
          style="
            font-weight: 700;
            color: #161a32;
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          "
        >
          {{ transaction.note || transaction.merchant || "Belanja" }}
        </div>
        <div
          class="meta"
          style="
            font-size: 11px;
            color: #707973;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          "
        >
          <span
            v-if="transaction.note && transaction.merchant"
            style="font-weight: 600; color: #161a32; margin-right: 4px"
          >
            {{ transaction.merchant }} ·
          </span>
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
            Via {{ transaction.source === "ocr" ? "Struk" : "Share" }}
          </span>
        </div>
      </div>
    </div>
    <div class="amount-col" style="text-align: right; flex-shrink: 0; margin-left: 8px">
      <div class="amount font-headline" style="font-weight: 800; color: #ba1a1a; font-size: 14px">
        -{{ formatRp(parseFloat(transaction.amount)) }}
      </div>
      <div
        class="envelope-tag"
        :style="{
          fontSize: '10px',
          color: transaction.envelopeColor,
          background: `${transaction.envelopeColor}12`,
          border: `1px solid ${transaction.envelopeColor}20`,
          padding: '2px 8px',
          borderRadius: '12px',
          marginTop: '4px',
          display: 'inline-block',
          fontWeight: '700',
        }"
      >
        {{ transaction.envelopeName }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatRp } from "../js/routes";
import { getEnvelopeEmoji } from "../js/utils/emoji";

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
