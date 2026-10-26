import { Db, MongoClient } from "mongodb";
import { Chart } from "./schema";

const DB_NAME = "astro-star-sign";

// `next dev` re-evaluates modules on every change; caching on globalThis keeps a single
// client (and its connection pool) across reloads instead of leaking a new one each time
const globalForDb = globalThis as typeof globalThis & {
  dbPromise?: Promise<Db>;
};

const connect = async (): Promise<Db> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set; add it to .env.local");
  }

  const client = await new MongoClient(uri).connect();
  // the Atlas URI has no database path, so name it explicitly; client.db() would use "test"
  const db = client.db(DB_NAME);

  // the db enforces one chart per birth moment and place; this is a no-op if the index exists
  await db
    .collection("charts")
    .createIndex(
      { bornAt: 1, "location.lat": 1, "location.long": 1 },
      { unique: true },
    );

  return db;
};

export const getDb = (): Promise<Db> => {
  if (!globalForDb.dbPromise) {
    // a failed connection clears the cache so the next request retries
    globalForDb.dbPromise = connect().catch((e) => {
      globalForDb.dbPromise = undefined;
      throw e;
    });
  }

  return globalForDb.dbPromise;
};

export const getCharts = async () => (await getDb()).collection<Chart>("charts");
