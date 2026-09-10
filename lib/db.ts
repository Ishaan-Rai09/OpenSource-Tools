// lib/db.ts
import mongoose from "mongoose";
let done = false;
export async function dbConnect(): Promise<boolean> {
  const uri = process.env.MONGODB_URI; if (!uri || done) return !!uri && done;
  await mongoose.connect(uri); done = true; return true;
}
