import express from "express";
import cors from "cors";
import { ENV } from "./config/env";
import { connectDB } from "./config/db";
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware";
import authRoutes from "./routes/authRoutes";
import postRoutes from "./routes/postRoutes";
import commentRoutes from "./routes/commentRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Blog API",
    version: "1.0.0",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me",
      },
      posts: {
        list: "GET /api/posts",
        create: "POST /api/posts",
        getOne: "GET /api/posts/:id",
        update: "PATCH /api/posts/:id",
        delete: "DELETE /api/posts/:id",
      },
      comments: {
        listForPost: "GET /api/posts/:postId/comments",
        create: "POST /api/posts/:postId/comments",
        update: "PATCH /api/comments/:id",
        delete: "DELETE /api/comments/:id",
      },
      users: {
        list: "GET /api/users",
        profile: "GET /api/users/:id",
        posts: "GET /api/users/:id/posts",
      },
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api", commentRoutes); // mounted at /api (not /api/comments)
app.use("/api/users", userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(ENV.PORT, () => {
      console.log(`http://localhost:${ENV.PORT}`);
      console.log(`Environment: ${ENV.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
