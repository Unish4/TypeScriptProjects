import mongoose from "mongoose";
import { ENV } from "./env";

export const connectDB = async (req: Request, res: Response): Promise<void> => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI);
    console.log("Mongodb connected successfully", conn.connection.host);
  } catch (error) {
    console.error("Error connecting mongodb", error);
    process.exit(1);
  }
};
