import { request } from "./client";

export interface Transaction {
  id: string;
  amount: string;
  merchant: string | null;
  note: string | null;
  transactionAt: string;
  source: string;
  createdBy: string;
  envelopeName: string;
  envelopeColor: string;
  rawImageKey?: string | null;
}

export const transactions = {
  async list(params: { periodId?: string; allocationId?: string; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.periodId) query.set("periodId", params.periodId);
    if (params.allocationId) query.set("allocationId", params.allocationId);
    if (params.limit) query.set("limit", params.limit.toString());
    return request<Transaction[]>(`/transactions?${query.toString()}`);
  },

  async create(data: {
    periodId: string;
    allocationId: string;
    amount: number;
    merchant?: string;
    note?: string;
    transactionAt: string;
    source?: string;
    rawImageKey?: string;
  }) {
    return request("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async createSplit(data: {
    transactions: Array<{
      periodId: string;
      allocationId: string;
      amount: number;
      merchant?: string;
      note?: string;
      transactionAt: string;
      source?: string;
      rawImageKey?: string;
    }>;
    forceWriteClosedPeriod?: boolean;
    allowDuplicate?: boolean;
  }) {
    return request("/transactions/split", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async ocr(
    image: string,
    mimeType?: string,
    envelopes?: Array<{ id: string; name: string }>,
    onProgress?: (status: string) => void
  ) {
    const { jobId } = await request<{ jobId: string }>("/transactions/ocr", {
      method: "POST",
      body: JSON.stringify({ image, mimeType, envelopes }),
    });

    const poll = async (): Promise<{
      amount: number | null;
      merchant: string | null;
      date: string | null;
      rawText: string;
      confidence: "high" | "medium" | "low";
      recommendedEnvelopeId?: string | null;
      analysisReasoning?: string | null;
      receiptUrl?: string | null;
    }> => {
      const job = await request<{
        status: "pending" | "processing" | "completed" | "failed";
        result?: {
          amount: number | null;
          merchant: string | null;
          date: string | null;
          rawText: string;
          confidence: "high" | "medium" | "low";
          recommendedEnvelopeId?: string | null;
          analysisReasoning?: string | null;
          receiptUrl?: string | null;
        };
        error?: string;
      }>(`/transactions/ocr/status/${jobId}`);

      if (job.status === "completed" && job.result) {
        return job.result;
      }
      if (job.status === "failed") {
        throw new Error(job.error || "Ekstraksi OCR gagal");
      }

      if (onProgress) {
        if (job.status === "pending") {
          onProgress("Menunggu antrean...");
        } else if (job.status === "processing") {
          onProgress("Gemini sedang menganalisis gambar...");
        }
      }

      // Wait 1.5 seconds and poll again
      await new Promise(resolve => setTimeout(resolve, 1500));
      return poll();
    };

    return poll();
  },

  async parseText(text: string, envelopes?: Array<{ id: string; name: string }>) {
    return request<{
      amount: number | null;
      merchant: string | null;
      date: string | null;
      rawText: string;
      confidence: "high" | "medium" | "low";
      recommendedEnvelopeId?: string | null;
      analysisReasoning?: string | null;
      formattedNote?: string | null;
    }>("/transactions/parse-text", {
      method: "POST",
      body: JSON.stringify({ text, envelopes }),
    });
  },

  async update(
    id: string,
    data: Partial<{
      amount: number;
      merchant: string;
      note: string;
      allocationId: string;
      transactionAt: string;
      rawImageKey: string;
    }>
  ) {
    return request(`/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async remove(id: string) {
    return request(`/transactions/${id}`, { method: "DELETE" });
  },
};
