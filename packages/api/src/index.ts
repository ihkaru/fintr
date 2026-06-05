import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { authRoutes } from "./routes/auth";
import { householdRoutes } from "./routes/households";
import { envelopeRoutes } from "./routes/envelopes";
import { periodRoutes } from "./routes/periods";
import { allocationRoutes } from "./routes/allocations";
import { transactionRoutes } from "./routes/transactions";
import { reconcileRoutes } from "./routes/reconcile";
import { syncRoutes } from "./routes/sync";

const app = new Elysia()
  .use(
    cors({
      // Supports comma-separated origins: e.g. "https://fintr.dvlpid.my.id,http://localhost:5173"
      origin: (process.env.APP_URL || "http://localhost:5173").split(",").map(o => o.trim()),
      credentials: true,
    })
  )
  .use(staticPlugin({ assets: "public", prefix: "/public" }))
  .get("/", () => ({
    name: "FinTr API",
    version: "0.1.0",
    status: "running",
  }))
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  // Routes
  .use(authRoutes)
  .use(householdRoutes)
  .use(envelopeRoutes)
  .use(periodRoutes)
  .use(allocationRoutes)
  .use(transactionRoutes)
  .use(reconcileRoutes)
  .use(syncRoutes)
  // Error handler
  .onError(({ code, error, set }) => {
    const message = (error as any)?.message || String(error);
    console.error(`[${code}]`, message);

    if (code === "VALIDATION") {
      set.status = 400;
      return { error: "Validation error", details: message };
    }

    if (message.includes("Unauthorized")) {
      set.status = 401;
      return { error: message };
    }

    set.status = 500;
    return { error: "Internal server error" };
  })
  .listen(parseInt(process.env.PORT || "3001"));

console.log(`🚀 FinTr API running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
