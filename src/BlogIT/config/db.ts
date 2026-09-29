import mongoose from "mongoose";
import { ENV } from "./env";

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI);
    console.log("Connected successfully", conn.connection.host);
  } catch (error) {
    console.log("Failed to connecct mongodb", error);
    process.exit(1);
  }
};
