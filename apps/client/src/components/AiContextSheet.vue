<template>
  <f7-sheet
    :opened="opened"
    @sheet:closed="$emit('update:opened', false)"
    style="height: 82vh; --f7-sheet-bg-color: #ffffff"
    swipe-to-close
    backdrop
  >
    <div style="display: flex; flex-direction: column; height: 100%">
      <!-- Header -->
      <div
        style="
          padding: 20px 20px 16px;
          border-bottom: 1px solid #e8ede9;
          background: #ffffff;
          flex-shrink: 0;
        "
      >
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px">
          <div
            style="
              width: 40px;
              height: 40px;
              border-radius: 12px;
              background: linear-gradient(135deg, #0f5238, #1a7a54);
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            "
          >
            <span class="material-symbols-outlined" style="color: white; font-size: 22px">
              psychology
            </span>
          </div>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #161a32">
              Tanya AI Financial Advisor
            </div>
            <div style="font-size: 11px; color: #707973; margin-top: 2px">
              Salin konteks → tempel ke ChatGPT, Claude, atau Gemini
            </div>
          </div>
        </div>

        <!-- Step indicators -->
        <div style="display: flex; gap: 6px; margin-top: 12px">
          <div
            v-for="(step, i) in ['Salin konteks', 'Buka AI favoritmu', 'Tempel & tanya']"
            :key="i"
            style="
              display: flex;
              align-items: center;
              gap: 5px;
              font-size: 10px;
              color: #707973;
              font-weight: 600;
            "
          >
            <div
              style="
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #e8ede9;
                color: #0f5238;
                font-weight: 800;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
              "
            >
              {{ i + 1 }}
            </div>
            {{ step }}
            <span v-if="i < 2" style="color: #bfc9c1; margin-left: 1px">›</span>
          </div>
        </div>
      </div>

      <!-- Scrollable context preview -->
      <div
        style="
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
          background: #f7f9f8;
          font-family:
            &quot;JetBrains Mono&quot;, &quot;Fira Code&quot;, &quot;Courier New&quot;, monospace;
          font-size: 11px;
          line-height: 1.7;
          color: #2d3748;
          white-space: pre-wrap;
          word-break: break-word;
        "
      >
        {{ contextText }}
      </div>

      <!-- Sticky CTA -->
      <div
        style="
          padding: 16px 20px;
          padding-bottom: calc(16px + env(safe-area-inset-bottom));
          background: #ffffff;
          border-top: 1px solid #e8ede9;
          flex-shrink: 0;
        "
      >
        <button
          @click="$emit('copy')"
          :style="{
            width: '100%',
            padding: '14px',
            borderRadius: '14px',
            border: 'none',
            background: copied ? '#16a34a' : 'linear-gradient(135deg, #0f5238, #1a7a54)',
            color: 'white',
            fontSize: '15px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: copied
              ? '0 4px 16px rgba(22, 163, 74, 0.35)'
              : '0 4px 16px rgba(15, 82, 56, 0.25)',
          }"
        >
          <span class="material-symbols-outlined" style="font-size: 20px">
            {{ copied ? "check_circle" : "content_copy" }}
          </span>
          {{ copied ? "Tersalin! Buka AI dan tempel 🚀" : "Salin Konteks Keuangan" }}
        </button>
        <div style="text-align: center; font-size: 10px; color: #b0b8b3; margin-top: 8px">
          Konteks ini tidak mengandung password atau data sensitif
        </div>
      </div>
    </div>
  </f7-sheet>
</template>

<script setup lang="ts">
import { f7Sheet } from "framework7-vue";

defineProps<{
  opened: boolean;
  contextText: string;
  copied: boolean;
}>();

defineEmits<{
  (e: "update:opened", val: boolean): void;
  (e: "copy"): void;
}>();
</script>
