import { ref } from "vue";
import { f7 } from "framework7-vue";
import { formatRp } from "../js/routes";

export function useAiContext() {
  const aiSheetOpened = ref(false);
  const aiContextText = ref("");
  const copied = ref(false);

  const buildContext = (params: {
    householdName: string;
    summary: { allocated: number; spent: number; remaining: number };
    allocationsData: any[];
    recentTxns: any[];
    currentUserProfile: any;
    partnerProfile: any;
    reconcileData: any;
  }) => {
    const {
      householdName,
      summary,
      allocationsData,
      recentTxns,
      currentUserProfile,
      partnerProfile,
      reconcileData,
    } = params;

    const now = new Date();
    const periodLabel = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    const generatedAt = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const savingRate =
      summary.allocated > 0 ? Math.round((summary.remaining / summary.allocated) * 100) : 0;

    // Build envelope rows
    const envelopeRows = allocationsData
      .map(a => {
        const spent = parseFloat(a.spent ?? "0");
        const allocated = parseFloat(a.allocated ?? "0");
        const remaining = allocated - spent;
        const rolloverLabel =
          a.rolloverBehavior === "rollover_self"
            ? "Menumpuk"
            : a.rolloverBehavior === "rollover_to_savings"
              ? "→ Tabungan"
              : "Reset";
        const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
        const status = (a as any).isActive === false ? " [DITUTUP]" : "";
        return `  - ${a.envelopeName}${status}: Alokasi Rp ${formatRp(allocated)} | Terpakai Rp ${formatRp(spent)} (${pct}%) | Sisa Rp ${formatRp(remaining)} | Rollover: ${rolloverLabel}`;
      })
      .join("\n");

    // Build recent transactions
    const txnRows = recentTxns
      .map(t => {
        const date = new Date(t.transactionAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });
        const sourceLabel =
          t.source === "ocr" ? "📷 Struk" : t.source === "share" ? "📱 Share" : "✍️ Manual";
        return `  - ${date} | ${t.merchant || t.note || "Pengeluaran"} | ${t.envelopeName} | -Rp ${formatRp(parseFloat(t.amount))} | ${sourceLabel}`;
      })
      .join("\n");

    // Usage pattern analysis
    const totalTxns = recentTxns.length;
    const bySource = recentTxns.reduce(
      (acc, t) => {
        acc[t.source] = (acc[t.source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const manualCount = bySource["manual"] || 0;
    const ocrCount = bySource["ocr"] || 0;
    const shareCount = bySource["share"] || 0;

    // Most active envelope by spend
    const mostActive = [...allocationsData].sort(
      (a, b) => parseFloat(b.spent ?? "0") - parseFloat(a.spent ?? "0")
    )[0];

    const usageSection = `## POLA PENGGUNAAN APLIKASI

  - Jumlah transaksi yang tampil   : ${totalTxns} transaksi (5 terakhir ditampilkan)
  - Metode pencatatan:
      ✍️ Input manual : ${manualCount} transaksi
      📷 Scan struk   : ${ocrCount} transaksi
      📱 Share/target : ${shareCount} transaksi
  - Amplop paling aktif            : ${mostActive ? `${mostActive.envelopeName} (Rp ${formatRp(parseFloat(mostActive.spent ?? "0"))} dari Rp ${formatRp(parseFloat(mostActive.allocated ?? "0"))})` : "Belum ada"}
  - Catatan akurasi data: ${manualCount === totalTxns ? "Semua data diinput manual — kemungkinan ada pengeluaran yang belum tercatat." : ocrCount > 0 || shareCount > 0 ? "Ada pencatatan via struk/share — data kemungkinan lebih akurat dan real-time." : "Tidak ada transaksi tercatat."}`;

    // Reconciliation section
    let reconcileSection = `## REKONSILIASI SALDO REKENING\n\n`;
    if (!reconcileData || reconcileData.status === "no_snapshot") {
      reconcileSection += `  ⚠️ Belum ada data rekonsiliasi. User belum pernah mencocokkan saldo\n  aplikasi dengan saldo rekening/dompet aktual.\n  Ini berarti kondisi keuangan nyata mungkin berbeda dari data di atas.`;
    } else {
      const expectedBal = parseFloat(reconcileData.expectedBalance || "0");
      const actualBal = reconcileData.actualBalance
        ? parseFloat(reconcileData.actualBalance)
        : null;
      const diff = reconcileData.difference ? parseFloat(reconcileData.difference) : null;

      reconcileSection += `  - Saldo tercatat aplikasi (expected) : Rp ${formatRp(expectedBal)}`;
      if (actualBal !== null) {
        reconcileSection += `\n  - Saldo aktual rekening/dompet       : Rp ${formatRp(actualBal)}`;
      } else {
        reconcileSection += `\n  - Saldo aktual rekening/dompet       : Belum diperbarui`;
      }
      if (diff !== null) {
        const diffLabel =
          diff > 0
            ? `+Rp ${formatRp(diff)} (lebih banyak dari yang tercatat di app)`
            : diff < 0
              ? `-Rp ${formatRp(Math.abs(diff))} (lebih sedikit dari yang tercatat — kemungkinan ada pengeluaran yang belum dicatat)`
              : "Rp 0 (rekening dan app sudah seimbang ✅)";
        reconcileSection += `\n  - Selisih                            : ${diffLabel}`;
      }
    }

    const partnerLine = partnerProfile
      ? `\nAnggota Rumah Tangga: ${currentUserProfile?.name || "Saya"} & ${partnerProfile?.name || "Pasangan"} (pengelolaan bersama)`
      : `\nAnggota Rumah Tangga: ${currentUserProfile?.name || "Saya"} (solo)`;

    const context = `# Konteks Keuangan FamiVault — ${householdName || "Rumah Tangga Saya"}
Periode: ${periodLabel} | Dihasilkan: ${generatedAt}${partnerLine}

---

## RINGKASAN ANGGARAN PERIODE INI

  - Total Anggaran Bulanan  : Rp ${formatRp(summary.allocated)}
  - Total Terpakai          : Rp ${formatRp(summary.spent)}
  - Sisa Dana Tersedia      : Rp ${formatRp(summary.remaining)}
  - Sisa Anggaran (%) periode ini : ${savingRate}%

---

## DETAIL AMPLOP ANGGARAN

${envelopeRows || "  (Belum ada data amplop)"}

---

## 5 TRANSAKSI TERAKHIR

${txnRows || "  (Belum ada transaksi tercatat)"}

---

${usageSection}

---

${reconcileSection}

---

## PETUNJUK UNTUK AI

Kamu adalah konsultan keuangan keluarga yang cerdas, bijak, dan empatik.
Data di atas adalah kondisi keuangan rumah tangga saya yang nyata dan real-time dari aplikasi FamiVault.

FamiVault menggunakan sistem anggaran berbasis amplop (envelope budgeting):
setiap bulan, total penghasilan dibagi ke "amplop" pos pengeluaran (Makan, Transportasi, dll).
Sisa dana di setiap amplop di akhir bulan bisa di-reset, menumpuk, atau dipindah ke tabungan.

Gunakan data ini sebagai konteks utama untuk menjawab pertanyaan saya. Berikan jawaban yang:
1. Konkret dan berdasarkan angka nyata di atas
2. Mempertimbangkan sisa dana, perilaku rollover tiap amplop, dan pola pengeluaran
3. Jika ada selisih rekonsiliasi, pertimbangkan itu sebagai kondisi keuangan aktual
4. Jika saya menanyakan pembelian besar, hitung dampaknya secara spesifik per amplop
5. Berikan saran alternatif jika kondisi keuangan tidak memungkinkan

Pertanyaan saya:
`;

    return context;
  };

  const openAiContext = (params: Parameters<typeof buildContext>[0]) => {
    aiContextText.value = buildContext(params);
    aiSheetOpened.value = true;
    copied.value = false;
  };

  const copyContext = async () => {
    try {
      await navigator.clipboard.writeText(aiContextText.value);
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2500);
    } catch {
      // Fallback for older browsers / WebView
      const el = document.createElement("textarea");
      el.value = aiContextText.value;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2500);
    }
  };

  return {
    aiSheetOpened,
    aiContextText,
    copied,
    openAiContext,
    copyContext,
  };
}
