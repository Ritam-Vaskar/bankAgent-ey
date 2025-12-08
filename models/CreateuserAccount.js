import { de } from "date-fns/locale";
import mongoose from "mongoose";
import { unique } from "next/dist/build/utils";

const createUserAccountSchema = new mongoose.Schema(
  {
    name: { type: String,required: true },
    phone: { type: String,required: true },
    email: { type: String,required: true },

    aadharPhotoUrl: { type: String,required: true  },
    aadharNo: { type: String, required: true },

    panPhotoUrl: { type: String, required: true  },
    panNo: { type: String, required: true },

    address: { type: String,required: true },
    AccountNumber : {type: String , required:true}
  
    
  },
  { timestamps: true }
);

export default mongoose.models.CreateUserAcont ||
  mongoose.model("CreateUserAcont", createUserAccountSchema);
