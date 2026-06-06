<template>
  <f7-sheet
    v-model:opened="openedModel"
    style="height: auto; --f7-sheet-border-color: transparent; border-radius: 24px 24px 0 0"
    swipe-to-close
    backdrop
  >
    <div class="sheet-modal-inner" style="padding: 24px 16px; background: #ffffff">
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        "
      >
        <div style="font-size: 18px; font-weight: 700">Tambah Amplop Baru</div>
        <span
          class="material-symbols-outlined"
          style="cursor: pointer; color: var(--fintr-text-muted)"
          @click="openedModel = false"
        >
          close
        </span>
      </div>

      <div style="margin-bottom: 16px">
        <div style="font-size: 13px; color: var(--fintr-text-muted); margin-bottom: 6px">
          Nama Amplop
        </div>
        <input
          type="text"
          class="fintr-input"
          :value="newEnvelopeForm.name"
          @input="updateField('name', ($event.target as HTMLInputElement).value)"
          placeholder="e.g. Belanja Mingguan, Uang Kos, Listrik"
          style="
            width: 100%;
            padding: 12px;
            border: 1px solid #bfc9c1;
            border-radius: 12px;
            box-sizing: border-box;
          "
        />
      </div>

      <div style="margin-bottom: 16px">
        <div style="font-size: 13px; color: var(--fintr-text-muted); margin-bottom: 6px">
          Alokasi Bulanan Default
        </div>
        <input
          type="number"
          class="fintr-input"
          :value="newEnvelopeForm.defaultAmount"
          @input="
            updateField('defaultAmount', Number(($event.target as HTMLInputElement).value || 0))
          "
          placeholder="e.g. 500000"
          style="
            width: 100%;
            padding: 12px;
            border: 1px solid #bfc9c1;
            border-radius: 12px;
            box-sizing: border-box;
          "
        />
      </div>

      <div style="margin-bottom: 16px">
        <div style="font-size: 13px; color: var(--fintr-text-muted); margin-bottom: 8px">
          Warna Amplop
        </div>
        <div style="display: flex; gap: 8px; overflow-x: auto; padding: 6px 4px; margin: 0 -4px">
          <span
            v-for="color in colorPresets"
            :key="color"
            @click="updateField('color', color)"
            :style="{
              display: 'inline-block',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: color,
              cursor: 'pointer',
              border: '3px solid #ffffff',
              boxShadow:
                newEnvelopeForm.color === color ? '0 0 0 2px var(--fintr-primary)' : 'none',
              transform: newEnvelopeForm.color === color ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box',
            }"
          ></span>
        </div>
      </div>

      <div style="margin-bottom: 24px">
        <div style="font-size: 13px; color: var(--fintr-text-muted); margin-bottom: 6px">
          Perilaku Sisa Dana (Rollover)
        </div>
        <select
          class="fintr-input"
          :value="newEnvelopeForm.rolloverBehavior"
          @change="updateField('rolloverBehavior', ($event.target as HTMLSelectElement).value)"
          style="
            width: 100%;
            padding: 12px;
            border: 1px solid #bfc9c1;
            border-radius: 12px;
            box-sizing: border-box;
            background: #ffffff;
          "
        >
          <option value="reset">Reset (Kembali Nol)</option>
          <option value="rollover_self">Rollover (Biarkan menumpuk)</option>
          <option value="rollover_to_savings">Transfer ke Tabungan</option>
        </select>
      </div>

      <button
        class="btn-primary"
        :disabled="creatingEnvelope"
        @click="$emit('submit')"
        style="
          width: 100%;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
        "
      >
        {{ creatingEnvelope ? "Memproses..." : "Buat Amplop" }}
      </button>
    </div>
  </f7-sheet>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { f7Sheet } from "framework7-vue";

interface EnvelopeForm {
  name: string;
  defaultAmount: number | "";
  color: string;
  rolloverBehavior: "reset" | "rollover_self" | "rollover_to_savings";
}

const props = defineProps<{
  opened: boolean;
  creatingEnvelope: boolean;
  newEnvelopeForm: EnvelopeForm;
  colorPresets: string[];
}>();

const emit = defineEmits<{
  (e: "update:opened", val: boolean): void;
  (e: "updateForm", val: Partial<EnvelopeForm>): void;
  (e: "submit"): void;
}>();

const openedModel = computed({
  get: () => props.opened,
  set: val => emit("update:opened", val),
});

const updateField = (field: keyof EnvelopeForm, value: any) => {
  emit("updateForm", { [field]: value });
};
</script>
