import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: String,
    UID: String,
    mobile: String,
    email: String,

    ownerName: String,
    ownerEmail: String,
    ownerID: String
  },
  { timestamps: true }
);

export default mongoose.model("Shop", shopSchema);
