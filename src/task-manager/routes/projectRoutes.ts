import { Router } from "express";
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  toggleArchive,
} from "../controllers/projectController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.route("/").get(getProjects).post(createProject);

router.route("/:id").get(getProject).patch(updateProject).delete(deleteProject);

router.patch("/:id/archive", toggleArchive);

export default router;
