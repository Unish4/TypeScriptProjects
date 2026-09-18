import express from "express";
import cors from "cors";
import { ENV } from "./config/env";
import { connectDB } from "./config/db";
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware";
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import taskRoutes from "./routes/taskRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Task Manager API",
    version: "1.0.0",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me",
        uploadAvatar: "POST /api/auth/avatar",
        deleteAvatar: "DELETE /api/auth/avatar",
      },
      users: {
        list: "GET /api/users",
        profile: "GET /api/users/:id",
      },
      projects: {
        list: "GET /api/projects",
        create: "POST /api/projects",
        getOne: "GET /api/projects/:id",
        update: "PATCH /api/projects/:id",
        delete: "DELETE /api/projects/:id",
        archive: "PATCH /api/projects/:id/archive",
      },
      tasks: {
        listInProject: "GET /api/projects/:projectId/tasks",
        createInProject: "POST /api/projects/:projectId/tasks",
        getOne: "GET /api/tasks/:id",
        update: "PATCH /api/tasks/:id",
        updateStatus: "PATCH /api/tasks/:id/status",
        delete: "DELETE /api/tasks/:id",
      },
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", taskRoutes); // mounted at /api (not /api/tasks)

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
