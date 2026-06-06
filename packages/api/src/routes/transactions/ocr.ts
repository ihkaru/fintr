import { Elysia, t } from "elysia";
import { extractTransactionFromImage, extractTransactionFromText } from "../../services/ocr";
import fs from "node:fs";

interface OcrJob {
  status: "pending" | "processing" | "completed" | "failed";
  result?: any;
  error?: string;
  createdAt: number;
}

export const ocrJobs = new Map<string, OcrJob>();

export const ocrRoute = new Elysia()
  .post(
    "/ocr",
    async ({ body, set }) => {
      const now = Date.now();

      // Clean up jobs older than 10 minutes to prevent memory leak
      for (const [id, job] of ocrJobs.entries()) {
        if (now - job.createdAt > 10 * 60 * 1000) {
          ocrJobs.delete(id);
        }
      }

      const jobId = crypto.randomUUID();
      ocrJobs.set(jobId, {
        status: "pending",
        createdAt: now,
      });

      // Process OCR in the background (asynchronous worker)
      (async () => {
        try {
          ocrJobs.set(jobId, {
            status: "processing",
            createdAt: Date.now(),
          });

          // Save receipt image to local public/receipts folder
          let receiptUrl: string | undefined;
          try {
            let ext = "png";
            if (body.mimeType) {
              const matched = body.mimeType.match(/\/([a-zA-Z0-9+]+)$/);
              if (matched) ext = matched[1];
            } else if (body.image.startsWith("data:")) {
              const matched = body.image.match(/data:image\/([a-zA-Z0-9+]+);base64,/);
              if (matched) ext = matched[1];
            }
            if (ext === "jpeg") ext = "jpg";

            let base64Data = body.image;
            if (base64Data.includes(";base64,")) {
              base64Data = base64Data.split(";base64,")[1];
            }

            const buffer = Buffer.from(base64Data, "base64");
            const dir = "public/receipts";

            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            const filename = `${crypto.randomUUID()}.${ext}`;
            const filePath = `${dir}/${filename}`;
            await Bun.write(filePath, buffer);
            receiptUrl = `/public/receipts/${filename}`;
          } catch (fileErr) {
            console.error("Gagal menyimpan gambar struk belanja:", fileErr);
          }

          const result = await extractTransactionFromImage(
            body.image,
            body.mimeType,
            body.envelopes
          );
          ocrJobs.set(jobId, {
            status: "completed",
            result: {
              ...result,
              receiptUrl,
            },
            createdAt: Date.now(),
          });
        } catch (error: any) {
          console.error(`OCR Job ${jobId} failed:`, error);
          ocrJobs.set(jobId, {
            status: "failed",
            error: error.message || "Unknown error",
            createdAt: Date.now(),
          });
        }
      })();

      set.status = 202; // Accepted
      return { jobId };
    },
    {
      body: t.Object({
        image: t.String(), // base64
        mimeType: t.Optional(t.String()),
        envelopes: t.Optional(
          t.Array(
            t.Object({
              id: t.String(),
              name: t.String(),
            })
          )
        ),
      }),
    }
  )
  .get("/ocr/status/:jobId", async ({ params, set }) => {
    const job = ocrJobs.get(params.jobId);
    if (!job) {
      set.status = 404;
      return { error: "Job not found" };
    }
    return job;
  })
  .post(
    "/parse-text",
    async ({ body, set }) => {
      try {
        const result = await extractTransactionFromText(body.text, body.envelopes);
        return result;
      } catch (error: any) {
        set.status = 500;
        return { error: error.message || "Gagal memproses teks transaksi" };
      }
    },
    {
      body: t.Object({
        text: t.String(),
        envelopes: t.Optional(
          t.Array(
            t.Object({
              id: t.String(),
              name: t.String(),
            })
          )
        ),
      }),
    }
  );
