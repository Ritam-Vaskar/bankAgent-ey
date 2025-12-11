import mongoose from "mongoose";

const createaccountChatSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    
    isOpened : { type: Boolean, required: true },
  },

  { timestamps: true }
);

export default mongoose.models.CreateaccountChat ||
 mongoose.model("CreateaccountChat", createaccountChatSchema);
