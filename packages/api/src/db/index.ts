import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// For queries — connection pool
const queryClient = postgres(connectionString);

export const db = drizzle(queryClient, { schema });

// For migrations only (single connection)
export function createMigrationClient() {
  return postgres(connectionString, { max: 1 });
}
