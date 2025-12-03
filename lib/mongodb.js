import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/banking-onboarding"

const cached = global.mongoose || { conn: null, promise: null }

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI)
  }

  try {
    cached.conn = await cached.promise
    console.log("[v0] MongoDB connected")
    return cached.conn
  } catch (error) {
    console.error("[v0] MongoDB connection error:", error)
    throw error
  }
}

export default connectDB
