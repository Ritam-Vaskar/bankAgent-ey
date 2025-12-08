import mongoose from "mongoose";

const loanUserAccountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },

    loanType: { type: String }, // optional
    loanAmount: { type: Number },

    aadharPhotoUrl: { type: String, required: true },
    aadharNo: { type: String, required: true },

    panPhotoUrl: { type: String, required: true },
    panNo: { type: String, required: true },

    address: { type: String, required: true },


  },
  { timestamps: true }
);

export default mongoose.models.LoanUserAccount ||
  mongoose.model("LoanUserAccount", loanUserAccountSchema);
