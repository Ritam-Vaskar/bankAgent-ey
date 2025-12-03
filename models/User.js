import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  image: String,
  googleId: String,
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.User || mongoose.model("User", userSchema)
