import express from "express";
import cors from "cors";
import userRoutes from "./routes";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "User API",
    endpoints: {
      listUsers: "GET /api/users",
      getUser: "GET /api/users/:id",
      createUser: "POST /api/users",
      updateUser: "PATCH /api/users/:id",
      deleteUser: "DELETE /api/users/:id",
    },
  });
});

app.use("/api", userRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
