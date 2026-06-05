import { Elysia, t } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { registerClient, unregisterClient } from "../services/sync";

export const syncRoutes = new Elysia({ prefix: "/sync" }).use(authMiddleware).get(
  "/events",
  async ({ userId, householdId, set }) => {
    if (!householdId) {
      set.status = 400;
      return { error: "User is not a member of any household" };
    }

    console.log(
      `[Sync API] SSE connection established for user ${userId} in household ${householdId}`
    );

    // Configure SSE Headers
    set.headers["Content-Type"] = "text/event-stream";
    set.headers["Cache-Control"] = "no-cache";
    set.headers["Connection"] = "keep-alive";

    let clientObj: any = null;
    let pingInterval: any = null;

    const stream = new ReadableStream({
      start(controller) {
        // Register the connected client
        clientObj = registerClient(householdId, userId, controller);

        // Send initial success event
        const initialPayload = `event: open\ndata: ${JSON.stringify({ status: "connected", userId })}\n\n`;
        controller.enqueue(new TextEncoder().encode(initialPayload));

        // Set up keep-alive ping every 30 seconds
        pingInterval = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(": ping\n\n"));
          } catch (err) {
            clearInterval(pingInterval);
          }
        }, 30000);
      },
      cancel() {
        if (pingInterval) {
          clearInterval(pingInterval);
        }
        if (clientObj) {
          unregisterClient(householdId, clientObj);
        }
      },
    });

    return new Response(stream);
  },
  {
    query: t.Object({
      token: t.Optional(t.String()),
    }),
  }
);
