import mongoose from 'mongoose';

let isConnected = false;
let isConnecting = false;

export async function connectMongoDB(): Promise<boolean> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.log('ℹ️ [MongoDB] MONGODB_URI not set; running in resilient hybrid memory mode.');
    return false;
  }

  if (isConnected || isConnecting) {
    return isConnected;
  }

  isConnecting = true;

  try {
    // Set strictQuery for modern Mongoose 7/8
    mongoose.set('strictQuery', true);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 5000,
    });

    isConnected = true;
    isConnecting = false;
    console.log('🍃 [MongoDB] Successfully connected to MongoDB instance via Mongoose.');

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('⚠️ [MongoDB] Disconnected from MongoDB instance.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ [MongoDB] Connection error:', err.message);
    });

    return true;
  } catch (error: any) {
    isConnecting = false;
    isConnected = false;
    console.warn(`⚠️ [MongoDB] Could not reach MongoDB at "${mongoUri}": ${error.message}.`);
    console.log('⚡ [MongoDB] Resilient fallback active: Serving requests with in-memory persistence layer.');
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function disconnectMongoDB(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
