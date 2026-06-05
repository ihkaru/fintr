<template>
  <div>
    <!-- Single Envelope Selector Grid -->
    <div style="display: flex; flex-wrap: wrap; gap: 8px">
      <div
        v-for="a in allocations"
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
  </div>
</template>

<script setup lang="ts">
import { formatRp } from "../../js/routes";

defineProps<{
  allocations: Array<{
    id: string;
    envelopeName: string;
    envelopeColor: string;
    remaining: number | string;
  }>;
  modelValue: string;
  aiRecommendationText?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>
