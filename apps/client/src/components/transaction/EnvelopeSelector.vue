<template>
  <div>
    <!-- Smart Filtering Banner -->
    <div
      v-if="filterSufficient && hasSufficientEnvelopes"
      class="animate-in"
      style="
        margin-bottom: 10px;
        font-size: 12px;
        color: #0f5238;
        font-weight: 600;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(15, 82, 56, 0.06);
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid rgba(15, 82, 56, 0.15);
      "
    >
      <span>💡 Menampilkan kategori dengan saldo cukup</span>
      <span
        @click="emit('clear-filter')"
        style="
          color: #0f5238;
          text-decoration: underline;
          cursor: pointer;
          font-weight: 700;
          margin-left: 8px;
        "
      >
        Tampilkan Semua
      </span>
    </div>

    <!-- Single Envelope Selector Grid -->
    <div style="display: flex; flex-wrap: wrap; gap: 8px">
      <div
        v-for="a in filteredAllocations"
        :key="a.id"
        :style="{
          padding: '8px 12px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'all 0.2s',
          border: modelValue === a.id ? `2px solid ${a.envelopeColor}` : '1px solid #bfc9c1',
          background: modelValue === a.id ? `${a.envelopeColor}16` : '#ffffff',
          color: modelValue === a.id ? a.envelopeColor : '#707973',
        }"
        @click="emit('update:modelValue', a.id)"
      >
        <span
          :style="{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: a.envelopeColor,
            marginRight: '6px',
          }"
        ></span>
        {{ a.envelopeName }}
        <span style="font-size: 10px; opacity: 0.8; font-weight: 500; margin-left: 2px">
          ({{ formatRp(a.remaining) }})
        </span>
      </div>
    </div>

    <!-- AI Recommendation Text -->
    <div
      v-if="aiRecommendationText"
      class="animate-in"
      style="
        margin-top: 12px;
        padding: 10px 12px;
        background: rgba(15, 82, 56, 0.08);
        border-left: 3px solid #0f5238;
        border-radius: 6px;
        font-size: 12px;
        color: #0f5238;
        line-height: 1.4;
        font-weight: 600;
      "
    >
      {{ aiRecommendationText }}
    </div>

    <!-- Over-Budget Warning -->
    <div
      v-if="selectedAllocation && amount && Number(amount) > Number(selectedAllocation.remaining)"
      class="animate-in"
      style="
        margin-top: 12px;
        padding: 10px 12px;
        background: rgba(228, 106, 17, 0.08);
        border-left: 3px solid #e46a11;
        border-radius: 6px;
        font-size: 12px;
        color: #e46a11;
        line-height: 1.4;
        font-weight: 600;
      "
    >
      ⚠️ Anggaran untuk amplop "{{ selectedAllocation.envelopeName }}" tidak mencukupi (Sisa:
      {{ formatRp(selectedAllocation.remaining) }}). Transaksi manual akan menyebabkan saldo menjadi
      negatif.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatRp } from "../../js/routes";

const props = defineProps<{
  allocations: Array<{
    id: string;
    envelopeName: string;
    envelopeColor: string;
    remaining: number | string;
  }>;
  modelValue: string;
  aiRecommendationText?: string;
  amount?: number | "";
  filterSufficient?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "clear-filter"): void;
}>();

const selectedAllocation = computed(() => {
  return props.allocations.find(a => a.id === props.modelValue);
});

const hasSufficientEnvelopes = computed(() => {
  if (!props.amount) return false;
  return props.allocations.some(a => Number(a.remaining) >= Number(props.amount));
});

const filteredAllocations = computed(() => {
  if (props.filterSufficient && props.amount && hasSufficientEnvelopes.value) {
    return props.allocations.filter(a => Number(a.remaining) >= Number(props.amount));
  }
  return props.allocations;
});
</script>
