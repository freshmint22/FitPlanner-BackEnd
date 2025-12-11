import mongoose from 'mongoose';

export async function connectDB(): Promise<typeof mongoose> {
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!mongoUri) {
    throw new Error('No MONGODB_URI or DATABASE_URL provided in environment');
  }

  mongoose.set('strictQuery', false);
  return mongoose.connect(mongoUri);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

export default mongoose;
