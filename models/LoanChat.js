import mongoose from "mongoose";

const LoanChatSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },

  },

  { timestamps: true }
);

export default mongoose.model("LoanChat", LoanChatSchema);
