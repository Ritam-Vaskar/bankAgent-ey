import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoanChat", // points to the chat collection
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

    fileUrl: {
      type: String,
      default: null,
    },
  },

  { timestamps: true }
);

export default mongoose.models.LoanMessage || mongoose.model("LoanMessage", messageSchema);
