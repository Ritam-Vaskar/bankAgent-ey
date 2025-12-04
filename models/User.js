import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  image: String,
  profilePicture: String,
  password: String,
  isSetPassword: { type: Boolean, default: false },
  bio: String,
  location: String,
  website: String,
  googleId: String,
  githubId: String,
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.User || mongoose.model("User", userSchema)
