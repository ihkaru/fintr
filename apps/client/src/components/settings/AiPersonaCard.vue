<template>
  <div class="card-glass animate-in" style="margin-bottom: 20px; padding: 20px">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
      <span class="material-symbols-outlined" style="font-size: 20px; color: var(--fintr-primary)">
        psychology
      </span>
      <div style="font-size: 15px; font-weight: 700">Profil AI & Persona Finansial</div>
    </div>
    <div style="font-size: 13px; color: var(--fintr-text-muted); margin-bottom: 12px">
      Tulis profil keuangan Anda agar Asisten AI dapat memberikan rekomendasi strategi anggaran,
      simulasi pembelian, dan saran yang lebih relevan untuk Anda.
    </div>

    <!-- Suggested topics to write about -->
    <div
      style="
        background: rgba(var(--fintr-primary-rgb, 15, 82, 56), 0.05);
        border: 1px solid rgba(var(--fintr-primary-rgb, 15, 82, 56), 0.15);
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 16px;
        font-size: 11px;
        color: var(--fintr-text-muted);
      "
    >
      <div style="font-weight: 700; color: var(--fintr-primary); margin-bottom: 4px">
        💡 Contoh yang bisa Anda ceritakan:
      </div>
      <ul style="margin: 0; padding-left: 16px; display: flex; flex-direction: column; gap: 4px">
        <li>"Saya ASN, gajian tanggal 1 dan tunjangan tanggal 15."</li>
        <li>"Saya freelance dengan pendapatan tidak tentu setiap bulan."</li>
        <li>"Sedang menabung Rp 5jt/bln untuk uang muka rumah."</li>
        <li>"Ada cicilan KPR luar aplikasi sebesar Rp 3jt tiap tanggal 5."</li>
      </ul>
    </div>

    <div style="margin-bottom: 12px">
      <textarea
        class="fintr-input"
        v-model="personaText"
        rows="4"
        placeholder="Tulis profil atau preferensi keuangan Anda di sini..."
        style="resize: vertical; min-height: 100px; font-size: 13px; line-height: 1.5"
      ></textarea>
    </div>

    <button
      class="btn-primary"
      style="background: linear-gradient(135deg, var(--fintr-primary), #1b744d)"
      @click="savePersona"
    >
      Simpan Preferensi AI 💾
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { f7 } from "framework7-vue";

const personaText = ref("");

onMounted(() => {
  personaText.value = localStorage.getItem("fintr_ai_persona") || "";
});

const savePersona = () => {
  localStorage.setItem("fintr_ai_persona", personaText.value.trim());
  f7.toast
    .create({
      text: "Profil AI & Persona Finansial berhasil disimpan! 🧠✨",
      closeTimeout: 2000,
      destroyOnClose: true,
    })
    .open();
};
</script>
