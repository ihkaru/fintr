import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { db } from "../db/index";
import { transactions, budgetAllocations, budgetPeriods, envelopeTemplates } from "../db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { extractTransactionFromImage, extractTransactionFromText } from "../services/ocr";
import { broadcastToHousehold } from "../services/sync";
import fs from "node:fs";

interface OcrJob {
  status: "pending" | "processing" | "completed" | "failed";
  result?: any;
  error?: string;
  createdAt: number;
}

const ocrJobs = new Map<string, OcrJob>();

export const transactionRoutes = new Elysia({ prefix: "/transactions" })
  .use(authMiddleware)
  .get(
    "/",
    async ({ query, householdId, set }) => {
      if (!householdId) {
        set.status = 400;
        return { error: "Household required" };
      }

      // Build query with filters
      const conditions = [eq(budgetPeriods.householdId, householdId)];

      if (query.periodId) {
        conditions.push(eq(transactions.periodId, query.periodId));
      }
      if (query.allocationId) {
        conditions.push(eq(transactions.allocationId, query.allocationId));
      }

      const results = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          merchant: transactions.merchant,
          note: transactions.note,
          transactionAt: transactions.transactionAt,
          source: transactions.source,
          createdBy: transactions.createdBy,
          envelopeName: envelopeTemplates.name,
          envelopeColor: envelopeTemplates.color,
          rawImageKey: transactions.rawImageKey,
        })
        .from(transactions)
        .innerJoin(budgetAllocations, eq(transactions.allocationId, budgetAllocations.id))
        .innerJoin(envelopeTemplates, eq(budgetAllocations.templateId, envelopeTemplates.id))
        .innerJoin(budgetPeriods, eq(transactions.periodId, budgetPeriods.id))
        .where(and(...conditions))
        .orderBy(desc(transactions.transactionAt))
        .limit(query.limit ? parseInt(query.limit) : 50)
        .offset(query.offset ? parseInt(query.offset) : 0);

      return results;
    },
    {
      query: t.Object({
        periodId: t.Optional(t.String()),
        allocationId: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/",
    async ({ body, userId, householdId, set }) => {
      // Check if period is closed
      const [period] = await db
        .select({ isClosed: budgetPeriods.isClosed })
        .from(budgetPeriods)
        .where(eq(budgetPeriods.id, body.periodId));

      if (!period) {
        set.status = 404;
        return { error: "Periode tidak ditemukan" };
      }
      if (period.isClosed) {
        set.status = 400;
        return { error: "PERIOD_CLOSED" };
      }

      const [txn] = await db
        .insert(transactions)
        .values({
          periodId: body.periodId,
          allocationId: body.allocationId,
          createdBy: userId,
          amount: body.amount.toString(),
          merchant: body.merchant || null,
          note: body.note || null,
          transactionAt: new Date(body.transactionAt),
          source: body.source || "manual",
          rawImageKey: body.rawImageKey || null,
        })
        .returning();

      if (householdId) {
        broadcastToHousehold(householdId, userId, "transaction_changed");
      }

      return txn;
    },
    {
      body: t.Object({
        periodId: t.String(),
        allocationId: t.String(),
        amount: t.Number(),
        merchant: t.Optional(t.String()),
        note: t.Optional(t.String()),
        transactionAt: t.String(), // ISO date string
        source: t.Optional(t.Union([t.Literal("manual"), t.Literal("ocr"), t.Literal("share")])),
        rawImageKey: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/split",
    async ({ body, userId, householdId, set }) => {
      const periodIds = Array.from(new Set(body.transactions.map(t => t.periodId)));
      if (periodIds.length > 0) {
        const periods = await db
          .select({ id: budgetPeriods.id, isClosed: budgetPeriods.isClosed })
          .from(budgetPeriods)
          .where(inArray(budgetPeriods.id, periodIds));

        for (const p of periods) {
          if (p.isClosed) {
            set.status = 400;
            return { error: "PERIOD_CLOSED" };
          }
        }
      }

      const results = await db.transaction(async tx => {
        const txns = [];
        for (const item of body.transactions) {
          const [inserted] = await tx
            .insert(transactions)
            .values({
              periodId: item.periodId,
              allocationId: item.allocationId,
              createdBy: userId,
              amount: item.amount.toString(),
              merchant: item.merchant || null,
              note: item.note || null,
              transactionAt: new Date(item.transactionAt),
              source: item.source || "manual",
              rawImageKey: item.rawImageKey || null,
            })
            .returning();
          txns.push(inserted);
        }
        return txns;
      });

      if (householdId) {
        broadcastToHousehold(householdId, userId, "transaction_changed");
      }

      return results;
    },
    {
      body: t.Object({
        transactions: t.Array(
          t.Object({
            periodId: t.String(),
            allocationId: t.String(),
            amount: t.Number(),
            merchant: t.Optional(t.String()),
            note: t.Optional(t.String()),
            transactionAt: t.String(), // ISO date string
            source: t.Optional(
              t.Union([t.Literal("manual"), t.Literal("ocr"), t.Literal("share")])
            ),
            rawImageKey: t.Optional(t.String()),
          })
        ),
      }),
    }
  )
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
  )
  .patch(
    "/:id",
    async ({ params, body, userId, householdId, set }) => {
      const [existingTxn] = await db
        .select({ periodId: transactions.periodId })
        .from(transactions)
        .where(eq(transactions.id, params.id));

      if (!existingTxn) {
        set.status = 404;
        return { error: "Transaksi tidak ditemukan" };
      }

      // Check if period is closed
      const [period] = await db
        .select({ isClosed: budgetPeriods.isClosed })
        .from(budgetPeriods)
        .where(eq(budgetPeriods.id, existingTxn.periodId));

      if (period?.isClosed) {
        set.status = 400;
        return { error: "PERIOD_CLOSED" };
      }

      const updates: Record<string, unknown> = {};
      if (body.amount !== undefined) updates.amount = body.amount.toString();
      if (body.merchant !== undefined) updates.merchant = body.merchant;
      if (body.note !== undefined) updates.note = body.note;
      if (body.allocationId !== undefined) updates.allocationId = body.allocationId;
      if (body.transactionAt !== undefined) updates.transactionAt = new Date(body.transactionAt);
      if (body.rawImageKey !== undefined) updates.rawImageKey = body.rawImageKey;

      const [updated] = await db
        .update(transactions)
        .set(updates)
        .where(eq(transactions.id, params.id))
        .returning();

      if (!updated) {
        set.status = 404;
        return { error: "Transaksi tidak ditemukan" };
      }

      if (householdId) {
        broadcastToHousehold(householdId, userId, "transaction_changed");
      }

      return updated;
    },
    {
      body: t.Object({
        amount: t.Optional(t.Number()),
        merchant: t.Optional(t.String()),
        note: t.Optional(t.String()),
        allocationId: t.Optional(t.String()),
        transactionAt: t.Optional(t.String()),
        rawImageKey: t.Optional(t.String()),
      }),
    }
  )
  .delete("/:id", async ({ params, userId, householdId, set }) => {
    const [existingTxn] = await db
      .select({ periodId: transactions.periodId })
      .from(transactions)
      .where(eq(transactions.id, params.id));

    if (!existingTxn) {
      set.status = 404;
      return { error: "Transaksi tidak ditemukan" };
    }

    // Check if period is closed
    const [period] = await db
      .select({ isClosed: budgetPeriods.isClosed })
      .from(budgetPeriods)
      .where(eq(budgetPeriods.id, existingTxn.periodId));

    if (period?.isClosed) {
      set.status = 400;
      return { error: "PERIOD_CLOSED" };
    }

    const [deleted] = await db
      .delete(transactions)
      .where(eq(transactions.id, params.id))
      .returning();

    if (!deleted) {
      set.status = 404;
      return { error: "Transaksi tidak ditemukan" };
    }

    if (householdId) {
      broadcastToHousehold(householdId, userId, "transaction_changed");
    }

    return { message: "Transaksi dihapus" };
  });
