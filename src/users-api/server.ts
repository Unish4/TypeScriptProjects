import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import userRoutes from "./routes/userRoutes";
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "User API",
    version: "1.0.0",
    endpoints: {
      register: "POST /api/users/register",
      login: "POST /api/users/login",
      getProfile: "GET /api/users/profile",
      updateProfile: "PATCH /api/users/profile",
      getAllUsers: "GET /api/users",
    },
  });
});

app.use("/api/users", userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🔗 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
