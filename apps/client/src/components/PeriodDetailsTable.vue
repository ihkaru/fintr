<template>
  <div
    style="
      background: white;
      border: 1px solid #bfc9c1;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
    "
  >
    <div
      style="
        padding: 16px;
        border-bottom: 1px solid #bfc9c1;
        font-weight: 800;
        color: #161a32;
        font-size: 14px;
      "
    >
      Tabel Rincian Periode
    </div>
    <div style="overflow-x: auto">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left">
        <thead>
          <tr
            style="
              background: #f3f1e9;
              border-bottom: 1px solid #bfc9c1;
              color: #404943;
              font-weight: 700;
            "
          >
            <th style="padding: 12px 16px">Periode</th>
            <th style="padding: 12px 16px; text-align: right">Anggaran</th>
            <th style="padding: 12px 16px; text-align: right">Terpakai</th>
            <th style="padding: 12px 16px; text-align: right">Sisa Dana</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in periodsData"
            :key="p.id"
            style="border-bottom: 1px solid #e3e8e4; color: #161a32"
          >
            <td style="padding: 12px 16px; font-weight: 600">{{ p.name }}</td>
            <td style="padding: 12px 16px; text-align: right; font-family: Inter, sans-serif">
              {{ formatRp(parseFloat(p.totalAllocated)) }}
            </td>
            <td style="padding: 12px 16px; text-align: right; font-family: Inter, sans-serif">
              {{ formatRp(parseFloat(p.totalSpent)) }}
            </td>
            <td
              style="
                padding: 12px 16px;
                text-align: right;
                font-weight: 700;
                color: #0f5238;
                font-family: Inter, sans-serif;
              "
            >
              {{ formatRp(parseFloat(p.totalRemaining)) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRp } from "../js/routes";

interface PeriodTotal {
  id: string;
  year: number;
  month: number;
  name: string;
  totalAllocated: string;
  totalSpent: string;
  totalRemaining: string;
}

defineProps<{
  periodsData: PeriodTotal[];
}>();
</script>
