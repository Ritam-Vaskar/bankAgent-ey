
import mongoose from "mongoose";


const createUserAccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String,required: true },
    phone: { type: String,required: true },
    email: { type: String,required: true },

    aadharPhotoUrl: { type: String,required: true  },
    aadharNo: { type: String, required: false, default: "PENDING_EXTRACTION" },

    panPhotoUrl: { type: String, required: true  },
    panNo: { type: String, required: false, default: "PENDING_EXTRACTION" },

    address: { type: String,required: true },
    AccountNumber : {type: String , required:true}
  
    
  },
  { timestamps: true }
);

export default mongoose.models.CreateUserAcont ||
  mongoose.model("CreateUserAcont", createUserAccountSchema);
