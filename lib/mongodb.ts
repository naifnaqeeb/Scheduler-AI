import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB_NAME || "scheduleai";

let client: MongoClient;
let db: Db;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (client && db) {
    return { client, db };
  }

  if (!global._mongoClientPromise) {
    const mongoClient = new MongoClient(MONGODB_URI);
    global._mongoClientPromise = mongoClient.connect();
  }

  client = await global._mongoClientPromise;
  db = client.db(DB_NAME);

  return { client, db };
}

export async function getDb(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

export default connectToDatabase;
