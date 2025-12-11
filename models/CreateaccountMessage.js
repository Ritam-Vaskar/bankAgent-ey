import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreateaccountChat", // points to the chat collection
      required: true,
    },
    
    sender: {
      type: String,
      enum: ["user", "bot"],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },
    index : 
    {
      type : Number
    }
  },

  { timestamps: true }
);

export default mongoose.models.CreateaccountMessage ||
 mongoose.model("CreateaccountMessage", messageSchema);
