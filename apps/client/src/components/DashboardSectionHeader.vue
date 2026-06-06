<template>
  <div
    class="section-header"
    :style="{
      marginTop: marginTop ? '16px' : '0',
      padding: '12px 20px 8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }"
  >
    <div class="title font-headline" style="font-size: 17px; font-weight: 800; color: #161a32">
      {{ title }}
    </div>
    <f7-link
      v-if="linkHref"
      :href="linkHref"
      class="action"
      style="font-size: 13px; font-weight: 700; color: #0f5238"
    >
      {{ linkLabel }}
    </f7-link>
    <f7-link
      v-else
      @click="$emit('click-link')"
      class="action"
      style="font-size: 13px; font-weight: 700; color: #0f5238"
    >
      {{ linkLabel }}
    </f7-link>
  </div>
</template>

<script setup lang="ts">
import { f7Link } from "framework7-vue";

withDefaults(
  defineProps<{
    title: string;
    linkLabel?: string;
    linkHref?: string;
    marginTop?: boolean;
  }>(),
  {
    linkLabel: "Semua →",
    linkHref: "",
    marginTop: false,
  }
);

defineEmits<{
  (e: "click-link"): void;
}>();
</script>
