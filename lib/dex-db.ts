// Dedicated MongoDB connection for the Veilex DEX matcher (separate db from the
// legacy template's "polaris"). Serverless-safe cached client.
import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DEX_DB || "veilex_dex";

declare global {
  // eslint-disable-next-line no-var
  var _veilexDexMongo: Promise<MongoClient> | undefined;
}

export async function getDexDb(): Promise<Db> {
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (!globalThis._veilexDexMongo) {
    globalThis._veilexDexMongo = new MongoClient(uri, { maxPoolSize: 10 }).connect();
  }
  const client = await globalThis._veilexDexMongo;
  return client.db(DB_NAME);
}

export const isDexDbConfigured = () => !!uri;
