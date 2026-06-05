export interface SyncClient {
  userId: string;
  controller: ReadableStreamDefaultController;
}

// Map of householdId -> Set of connected SyncClient
const activeClients = new Map<string, Set<SyncClient>>();

/**
 * Registers a new client connection for real-time synchronization.
 */
export function registerClient(
  householdId: string,
  userId: string,
  controller: ReadableStreamDefaultController
) {
  if (!activeClients.has(householdId)) {
    activeClients.set(householdId, new Set());
  }

  const client: SyncClient = { userId, controller };
  activeClients.get(householdId)!.add(client);
  console.log(`[Sync] Registered client for user ${userId} in household ${householdId}`);

  return client;
}

/**
 * Unregisters a client connection.
 */
export function unregisterClient(householdId: string, client: SyncClient) {
  const clients = activeClients.get(householdId);
  if (clients) {
    clients.delete(client);
    console.log(`[Sync] Unregistered client for user ${client.userId} in household ${householdId}`);
    if (clients.size === 0) {
      activeClients.delete(householdId);
    }
  }
}

/**
 * Broadcasts an event to all connected clients in a household (except the sender).
 */
export function broadcastToHousehold(
  householdId: string,
  senderUserId: string,
  event: string,
  data: any = {}
) {
  const clients = activeClients.get(householdId);
  if (!clients) return;

  const payload = `event: message\ndata: ${JSON.stringify({ event, data, senderUserId })}\n\n`;
  const encoder = new TextEncoder();
  const encodedPayload = encoder.encode(payload);

  console.log(
    `[Sync] Broadcasting event "${event}" to household ${householdId} from user ${senderUserId}`
  );

  for (const client of clients) {
    if (client.userId !== senderUserId) {
      try {
        client.controller.enqueue(encodedPayload);
      } catch (err) {
        console.error(`[Sync] Failed to push message to user ${client.userId}:`, err);
      }
    }
  }
}
