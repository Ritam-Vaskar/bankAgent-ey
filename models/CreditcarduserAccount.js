import mongoose from "mongoose";

const creditCardUserAccountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },

    cardType: { type: String }, // optional
    income: { type: Number },   // optional

    aadharPhotoUrl: { type: String, required: true },
    aadharNo: { type: String, required: true },

    panPhotoUrl: { type: String, required: true },
    panNo: { type: String, required: true },

    address: { type: String, required: true },


  },
  { timestamps: true }
);

export default mongoose.models.CreditCardUserAccount ||
  mongoose.model("CreditCardUserAccount", creditCardUserAccountSchema);
