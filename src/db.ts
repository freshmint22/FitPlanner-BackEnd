import mongoose from 'mongoose';

// In dev we can fallback to an in-memory MongoDB server when no external
// MongoDB is available. This keeps the dev UX smooth on machines without
// a running mongod instance.
export async function connectDB(): Promise<typeof mongoose> {
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  mongoose.set('strictQuery', false);

  if (mongoUri) {
    // Try connecting to the provided URI. If it fails and we're in dev,
    // fallback to an in-memory server.
    try {
      return await mongoose.connect(mongoUri);
    } catch (err) {
      console.warn('Failed to connect to provided MongoDB URI, falling back to in-memory DB', err);
      if (process.env.NODE_ENV === 'production') throw err;
    }
  }

  // Fallback: start an in-memory MongoDB (mongodb-memory-server)
  // This package is included as a devDependency in the project.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Keep reference to stop later if needed
  (global as any).__MONGO_SERVER__ = mongod;

  return mongoose.connect(uri);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  const mongod = (global as any).__MONGO_SERVER__;
  if (mongod) await mongod.stop();
}

export default mongoose;
