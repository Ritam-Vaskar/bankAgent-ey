import mongoose from "mongoose"

const onboardingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  flow: { type: String, default: "account_creation" },
  status: {
    type: String,
    enum: ["INIT", "PERSONAL_PENDING", "KYC_PENDING", "VERIFIED", "MCP_CREATED", "COMPLETED"],
    default: "INIT",
  },
  step: {
    type: String,
    enum: ["name", "dob", "phone", "address", "aadhaar", "pan", "verification", "final"],
    default: "name",
  },
  data: {
    fullName: String,
    dob: String,
    phone: String,
    email: String,
    address: String,
    aadhaarUrl: String,
    panUrl: String,
    aadhaarData: {},
    panData: {},
    accountNumber: String,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

export default mongoose.models.Onboarding || mongoose.model("Onboarding", onboardingSchema)
