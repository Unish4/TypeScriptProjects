import { Router } from "express";
import * as controller from "./controller";

const router = Router();

router.post("/users", controller.createUser);

router.get("/users", controller.getUsers);

router.get("/users/:id", controller.getUser);

router.patch("/users/:id", controller.updateUser);

router.delete("/users/:id", controller.deleteUser);

export default router;
