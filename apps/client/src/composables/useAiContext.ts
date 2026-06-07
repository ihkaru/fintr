import { ref } from "vue";
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
        const spent = parseFloat(a.totalSpent ?? "0");
        const allocated =
          parseFloat(a.allocatedAmount ?? "0") + parseFloat(a.rolloverAmount ?? "0");
        const remaining = parseFloat(a.remaining ?? "0");
        const rolloverLabel =
          a.rolloverBehavior === "rollover_self"
            ? "Menumpuk"
            : a.rolloverBehavior === "rollover_to_savings"
              ? "→ Tabungan"
              : "Reset";
        const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
        const status = (a as any).isActive === false ? " [DITUTUP]" : "";
        return `  - ${a.envelopeName}${status}: Alokasi ${formatRp(allocated)} | Terpakai ${formatRp(spent)} (${pct}%) | Sisa ${formatRp(remaining)} | Rollover: ${rolloverLabel}`;
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
        return `  - ${date} | ${t.merchant || t.note || "Pengeluaran"} | ${t.envelopeName} | -${formatRp(parseFloat(t.amount))} | ${sourceLabel}`;
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
      (a, b) => parseFloat(b.totalSpent ?? "0") - parseFloat(a.totalSpent ?? "0")
    )[0];

    const usageSection = `## POLA PENGGUNAAN APLIKASI

  - Jumlah transaksi yang tampil   : ${totalTxns} transaksi (5 terakhir ditampilkan)
  - Metode pencatatan:
      ✍️ Input manual : ${manualCount} transaksi
      📷 Scan struk   : ${ocrCount} transaksi
      📱 Share/target : ${shareCount} transaksi
  - Amplop paling aktif            : ${mostActive ? `${mostActive.envelopeName} (${formatRp(parseFloat(mostActive.totalSpent ?? "0"))} dari ${formatRp(parseFloat(mostActive.allocatedAmount ?? "0") + parseFloat(mostActive.rolloverAmount ?? "0"))})` : "Belum ada"}
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

      reconcileSection += `  - Saldo tercatat aplikasi (expected) : ${formatRp(expectedBal)}`;
      if (actualBal !== null) {
        reconcileSection += `\n  - Saldo aktual rekening/dompet       : ${formatRp(actualBal)}`;
      } else {
        reconcileSection += `\n  - Saldo aktual rekening/dompet       : Belum diperbarui`;
      }
      if (diff !== null) {
        const diffLabel =
          diff > 0
            ? `+${formatRp(diff)} (lebih banyak dari yang tercatat di app)`
            : diff < 0
              ? `-${formatRp(Math.abs(diff))} (lebih sedikit dari yang tercatat — kemungkinan ada pengeluaran yang belum dicatat)`
              : "Rp 0 (rekening dan app sudah seimbang ✅)";
        reconcileSection += `\n  - Selisih                            : ${diffLabel}`;
      }
    }

    const partnerLine = partnerProfile
      ? `\nAnggota Rumah Tangga: ${currentUserProfile?.name || "Saya"} & ${partnerProfile?.name || "Pasangan"} (pengelolaan bersama)`
      : `\nAnggota Rumah Tangga: ${currentUserProfile?.name || "Saya"} (solo)`;

    const aiPersona = localStorage.getItem("fintr_ai_persona") || "";
    let personaSection = "";
    if (aiPersona.trim()) {
      personaSection = `## PROFIL & PREFERENSI KEUANGAN PENGGUNA\n\n${aiPersona.trim()}\n\n---\n\n`;
    }

    const context = `# Konteks Keuangan FamiVault — ${householdName || "Rumah Tangga Saya"}
Periode: ${periodLabel} | Dihasilkan: ${generatedAt}${partnerLine}

---

${personaSection}## RINGKASAN ANGGARAN PERIODE INI

  - Total Anggaran Bulanan  : ${formatRp(summary.allocated)}
  - Total Terpakai          : ${formatRp(summary.spent)}
  - Sisa Dana Tersedia      : ${formatRp(summary.remaining)}
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

## PROSES BISNIS & ATURAN APLIKASI FAMIVAULT

Sebagai asisten, Anda harus menyarankan solusi terbaik kepada pengguna sesuai batasan dan fitur sistem FamiVault berikut:
1. **Aturan Penguncian & Transaksi Retroaktif**: Periode anggaran masa lalu yang sudah ditutup bersifat *read-only*. Namun, transaksi baru (OCR/Share Target) pada periode N-1 (1 bulan sebelum periode aktif) dapat dicatat paksa (\`forceWriteClosedPeriod: true\`), yang otomatis menghitung ulang rantai sisa rollover ke periode aktif (maksimal 1 tingkat akumulasi).
2. **Deteksi Transaksi Ganda**: Sistem memindai riwayat transaksi 72 jam terakhir dan mendeteksi potensi duplikasi (kesamaan nominal, merchant, dan waktu transaksi terjadi dalam rentang ±24 jam). Pengguna diberi pilihan "Tetap Simpan" atau "Batalkan".
3. **Penginputan Struk Belanja (OCR) Over-Budget**: Jika unggahan struk melebihi sisa saldo amplop, pengguna diberi 3 opsi: "Catat & Biarkan Saldo Minus", "Gunakan Saldo Amplop Lain" (mengaktifkan Smart Filtering yang hanya menampilkan amplop bersaldo cukup), atau "Naikkan Batas Anggaran Sekarang".
4. **Penyelarasan Rekonsiliasi**: Jika terjadi selisih negatif antara total uang riil dan saldo tercatat aplikasi, pengguna dapat menggunakan fitur Guided Action "Catat Selisih sebagai Pengeluaran" untuk membukukan transaksi penyesuaian otomatis di kategori "Lain-lain" secara instan.
5. **Edukasi Overuse Amplop Umum**: Penggunaan berlebih pada amplop umum ("Lain-lain") bernilai >60% (setelah minimal 10 transaksi dan aktif 7 hari) akan memicu nudge dasbor untuk menyarankan pemecahan kategori belanja menjadi amplop baru yang lebih spesifik.
6. **Sinkronisasi Offline**: Pencatatan luring diantrekan secara lokal. Kegagalan sinkronisasi karena validasi bisnis akan dicoba ulang otomatis 3 kali sebelum diparkir di antrean gagal (Failed Queue) untuk ditinjau secara manual oleh pengguna.
7. **Keamanan Gabung Rumah Tangga**: Pengguna yang ingin bergabung dengan household pasangan wajib membersihkan transaksi lama mereka (atau menyetujui opsi \`forceDeleteTransactions: true\`) demi mencegah data yatim (*orphaned data*).

---

## PETUNJUK UNTUK AI

Kamu adalah konsultan keuangan keluarga yang cerdas, bijak, dan empatik.
Data di atas adalah kondisi keuangan rumah tangga saya yang nyata dan real-time dari aplikasi FamiVault.

FamiVault menggunakan sistem anggaran berbasis amplop (envelope budgeting):
setiap bulan, total penghasilan dibagi ke "amplop" pos pengeluaran (Makan, Transportasi, dll).
Sisa dana di setiap amplop di akhir bulan bisa di-reset, menumpuk, atau dipindah ke tabungan.

Gunakan data ini sebagai konteks utama untuk menjawab pertanyaan saya. Berikan jawaban yang:
1. Konkret dan berdasarkan angka nyata di atas.
2. Mempertimbangkan sisa dana, perilaku rollover tiap amplop, pola pengeluaran, dan aturan proses bisnis FamiVault yang tertulis di atas.
3. Jika ada selisih rekonsiliasi, pertimbangkan itu sebagai kondisi keuangan aktual dan sarankan guided action penyesuaian otomatis jika relevan.
4. Jika saya menanyakan strategi atau simulasi pembelian barang besar ("Apakah uang saya cukup untuk membeli X?"):
   - Bandingkan harga barang dengan Sisa Anggaran periode berjalan atau total akumulasi amplop Tabungan/Rollover.
   - Jika sisa anggaran saat ini tidak cukup, hitung estimasi di bulan keberapa dana akan terkumpul berdasarkan sisa anggaran bulanan rata-rata.
   - Analisis apakah pembelian ini akan memicu pengeluaran rutin baru (liabilitas berulang/recurring liabilities) di masa depan, seperti biaya perawatan, langganan bulanan, atau cicilan, dan sarankan cara memasukkannya ke dalam amplop anggaran bulan berikutnya.
5. Sesuaikan saran berdasarkan profil, pola pendapatan (misal: ASN dengan gajian bertahap, freelancer), tenggat waktu kewajiban eksternal, atau target tabungan khusus yang tertera di bagian "PROFIL & PREFERENSI KEUANGAN PENGGUNA".
6. Gunakan istilah "Sisa Anggaran (%)" dan "Sisa Anggaran Rata-rata" (bukan "Saving Rate" atau "Rata-rata Menabung") agar selaras dengan UI yang dilihat pengguna.

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
