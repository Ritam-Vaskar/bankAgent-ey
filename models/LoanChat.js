import mongoose from "mongoose";

const LoanChatSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    incomeDocumentUrl: {
      type: String,
      default: null
    },
    extractedIncome: {
      type: String,
      default: null
    },
    availableLoans: {
      type: Array,
      default: []
    },
    selectedLoan: {
      type: Object,
      default: null
    },
    loanStatus: {
      type: String,
      enum: ["In Progress", "Applied", "Approved", "Rejected"],
      default: "In Progress"
    }
  },
  { timestamps: true }
);

export default mongoose.models.LoanChat || mongoose.model("LoanChat", LoanChatSchema);
