import mongoose from "mongoose";

const CreditcardChatSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    
  },

  { timestamps: true }
);

export default mongoose.model("CreditcardChat", CreditcardChatSchema);
