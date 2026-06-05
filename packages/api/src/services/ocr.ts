/**
 * OCR Service — Uses Gemini Vision via OpenAI-compatible proxy
 * to extract transaction details from receipt/payment screenshots.
 */

export interface OcrResult {
  amount: number | null;
  merchant: string | null;
  date: string | null; // ISO string
  rawText: string;
  confidence: "high" | "medium" | "low";
  recommendedEnvelopeId?: string | null;
  analysisReasoning?: string | null;
  items?: Array<{ name: string; quantity: number; price: number; total: number }> | null;
  formattedNote?: string | null;
}

export async function extractTransactionFromImage(
  imageBase64: string,
  mimeType: string = "image/jpeg",
  envelopes?: Array<{ id: string; name: string }>
): Promise<OcrResult> {
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL || "gemini-pro-vision";
  const apiKey = process.env.AI_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("AI_BASE_URL and AI_API_KEY must be configured");
  }

  let systemPrompt = `Kamu adalah asisten yang mengekstrak informasi transaksi dari gambar struk pembayaran atau screenshot transaksi digital (seperti QRIS dari BRImo).

Ekstrak informasi berikut:
1. amount: Jumlah pembayaran dalam Rupiah (angka saja, tanpa "Rp" atau titik)
2. merchant: Nama toko/merchant/penerima pembayaran
3. date: Tanggal transaksi dalam format ISO 8601 (YYYY-MM-DDTHH:mm:ss)
4. items: Rincian barang/item yang dibeli (jika gambar merupakan struk dengan daftar barang). Setiap item berisi:
   - name: nama item/barang
   - quantity: jumlah/kuantitas
   - price: harga satuan (angka saja)
   - total: total harga item tersebut (angka saja)`;

  if (envelopes && envelopes.length > 0) {
    systemPrompt += `\n5. recommendedEnvelopeId: ID amplop yang paling sesuai dari pilihan yang diberikan di bawah ini.
6. analysisReasoning: Alasan singkat berbahasa Indonesia mengapa amplop tersebut dipilih.

Daftar amplop anggaran/kategori pengeluaran yang tersedia:
${envelopes.map(e => `- ID: "${e.id}", Nama Amplop: "${e.name}"`).join("\n")}

Pilihlah salah satu ID amplop di atas yang paling menggambarkan jenis transaksi ini. Jika tidak ada yang cocok sama sekali, gunakan null.`;
  }

  systemPrompt += `\n\nJawab dalam format JSON saja, tanpa markdown atau penjelasan tambahan di luar JSON:
{
  "amount": 75400,
  "merchant": "TLOGOMAS 44 MALANG",
  "date": "2022-01-21T18:27:00",
  "items": [
    {
      "name": "POP MIE AYAM 75G",
      "quantity": 1,
      "price": 4900,
      "total": 4900
    }
  ]`;

  if (envelopes && envelopes.length > 0) {
    systemPrompt += `,
  "recommendedEnvelopeId": "some-envelope-uuid",
  "analysisReasoning": "Belanja kebutuhan pokok bulanan di Indomaret"`;
  }

  systemPrompt += `
}

Jika tidak bisa mengekstrak suatu field, gunakan null.
Jika gambar bukan struk/transaksi, kembalikan semua null.`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
            {
              type: "text",
              text: "Ekstrak informasi transaksi dari gambar ini.",
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for precise extraction
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} — ${error}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices[0]?.message?.content || "";

  // Try to parse JSON from the response
  try {
    // Remove potential markdown code fences
    const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    // Determine confidence
    let confidence: OcrResult["confidence"] = "high";
    if (!parsed.amount && !parsed.merchant) confidence = "low";
    else if (!parsed.amount || !parsed.merchant) confidence = "medium";

    // Format items to formattedNote
    let formattedNote: string | null = null;
    if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
      formattedNote =
        "🛒 Rincian Belanja:\n" +
        parsed.items
          .map((item: any) => {
            const qty = item.quantity || 1;
            const priceStr = item.price ? ` @ Rp ${item.price.toLocaleString("id-ID")}` : "";
            const totalStr = item.total ? ` (Rp ${item.total.toLocaleString("id-ID")})` : "";
            return `• ${qty}x ${item.name}${priceStr}${totalStr}`;
          })
          .join("\n");
    }

    return {
      amount: parsed.amount ? Number(parsed.amount) : null,
      merchant: parsed.merchant || null,
      date: parsed.date || null,
      rawText: content,
      confidence,
      recommendedEnvelopeId: parsed.recommendedEnvelopeId || null,
      analysisReasoning: parsed.analysisReasoning || null,
      items: parsed.items || null,
      formattedNote,
    };
  } catch {
    return {
      amount: null,
      merchant: null,
      date: null,
      rawText: content,
      confidence: "low",
      recommendedEnvelopeId: null,
      analysisReasoning: null,
      items: null,
      formattedNote: null,
    };
  }
}

export async function extractTransactionFromText(
  text: string,
  envelopes?: Array<{ id: string; name: string }>
): Promise<OcrResult> {
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL || "gemini-pro-vision";
  const apiKey = process.env.AI_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("AI_BASE_URL and AI_API_KEY must be configured");
  }

  let systemPrompt = `Kamu adalah asisten yang mengekstrak informasi transaksi dari teks detail transaksi, struk pembayaran, atau pesan teks share target (misalnya share transaksi BRImo).

Ekstrak informasi berikut:
1. amount: Jumlah pembayaran dalam Rupiah (angka saja, tanpa "Rp" atau titik)
2. merchant: Nama toko/merchant/penerima pembayaran
3. date: Tanggal transaksi dalam format ISO 8601 (YYYY-MM-DDTHH:mm:ss) atau gunakan tanggal hari ini jika tidak ada info tanggal.
4. items: Rincian barang/item yang dibeli (jika teks merupakan struk dengan daftar barang). Setiap item berisi:
   - name: nama item/barang
   - quantity: jumlah/kuantitas
   - price: harga satuan (angka saja)
   - total: total harga item tersebut (angka saja)`;

  if (envelopes && envelopes.length > 0) {
    systemPrompt += `\n5. recommendedEnvelopeId: ID amplop yang paling sesuai dari pilihan yang diberikan di bawah ini.
6. analysisReasoning: Alasan singkat berbahasa Indonesia mengapa amplop tersebut dipilih.

Daftar amplop anggaran/kategori pengeluaran yang tersedia:
${envelopes.map(e => `- ID: "${e.id}", Nama Amplop: "${e.name}"`).join("\n")}

Pilihlah salah satu ID amplop di atas yang paling menggambarkan jenis transaksi ini. Jika tidak ada yang cocok sama sekali, gunakan null.`;
  }

  systemPrompt += `\n\nJawab dalam format JSON saja, tanpa markdown atau penjelasan tambahan di luar JSON:
{
  "amount": 75400,
  "merchant": "TLOGOMAS 44 MALANG",
  "date": "2022-01-21T18:27:00",
  "items": [
    {
      "name": "POP MIE AYAM 75G",
      "quantity": 1,
      "price": 4900,
      "total": 4900
    }
  ]`;

  if (envelopes && envelopes.length > 0) {
    systemPrompt += `,
  "recommendedEnvelopeId": "some-envelope-uuid",
  "analysisReasoning": "Belanja kebutuhan pokok bulanan di Indomaret"`;
  }

  systemPrompt += `
}

Jika tidak bisa mengekstrak suatu field, gunakan null.`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Ekstrak informasi transaksi dari teks berikut:\n\n${text}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} — ${error}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices[0]?.message?.content || "";

  // Try to parse JSON from the response
  try {
    const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    let confidence: OcrResult["confidence"] = "high";
    if (!parsed.amount && !parsed.merchant) confidence = "low";
    else if (!parsed.amount || !parsed.merchant) confidence = "medium";

    let formattedNote: string | null = null;
    if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
      formattedNote =
        "🛒 Rincian Belanja:\n" +
        parsed.items
          .map((item: any) => {
            const qty = item.quantity || 1;
            const priceStr = item.price ? ` @ Rp ${item.price.toLocaleString("id-ID")}` : "";
            const totalStr = item.total ? ` (Rp ${item.total.toLocaleString("id-ID")})` : "";
            return `• ${qty}x ${item.name}${priceStr}${totalStr}`;
          })
          .join("\n");
    }

    return {
      amount: parsed.amount ? Number(parsed.amount) : null,
      merchant: parsed.merchant || null,
      date: parsed.date || null,
      rawText: content,
      confidence,
      recommendedEnvelopeId: parsed.recommendedEnvelopeId || null,
      analysisReasoning: parsed.analysisReasoning || null,
      items: parsed.items || null,
      formattedNote,
    };
  } catch {
    return {
      amount: null,
      merchant: null,
      date: null,
      rawText: content,
      confidence: "low",
      recommendedEnvelopeId: null,
      analysisReasoning: null,
      items: null,
      formattedNote: null,
    };
  }
}
