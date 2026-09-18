import { Router } from "express";
import {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from "../controllers/taskController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router
  .route("/projects/:projectId/tasks")
  .get(getProjectTasks)
  .post(createTask);

router.patch("/tasks/:id/status", updateTaskStatus);

router.route("/tasks/:id").get(getTask).patch(updateTask).delete(deleteTask);

export default router;
