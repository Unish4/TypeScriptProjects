import express, { type Request, type Response } from "express";
import cors from "cors";
import { ENV } from "./config/env";
import { connectDB } from "./config/db";
import authRouter from "./routes/authRoutes";
import recipeRouter from "./routes/recipeRoutes";
import { reviewRouter } from "./routes/reviewRoutes";
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware";

const app = express();
app.use(cors());

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Recipe Sharing API",
    version: "1.0.0",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me (protected)",
        updateProfile: "PATCH /api/auth/profile (protected, multipart: avatar)",
        getProfile: "GET /api/auth/profile/:id",
      },
      recipes: {
        list: "GET /api/recipes",
        create: "POST /api/recipes (protected, multipart: images[])",
        get: "GET /api/recipes/:id",
        update: "PATCH /api/recipes/:id (protected)",
        delete: "DELETE /api/recipes/:id (protected)",
      },
      reviews: {
        listForRecipe: "GET /api/recipes/:recipeId/reviews",
        add: "POST /api/recipes/:recipeId/reviews (protected)",
        update: "PATCH /api/reviews/:id (protected)",
        delete: "DELETE /api/reviews/:id (protected)",
      },
    },
  });
});

app.use("/api/auth", authRouter);
app.use("/api/recipes", recipeRouter);
app.use("/api/reviews", reviewRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async (): Promise<void> => {
  try {
    await connectDB();

    const port = Number(ENV.PORT);

    app.listen(port, () => {
      console.log(`Recipe API running on http://localhost:${port}`);
      console.log(`Environment: ${ENV.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
