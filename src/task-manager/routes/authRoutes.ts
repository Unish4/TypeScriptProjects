import { Router } from "express"
import {
    register,
    login,
    getMe,
    uploadAvatar,
    deleteAvatar,
} from "../controllers/authController"
import { protect } from "../middleware/authMiddleware"
import upload from "../middleware/multerMiddleware"

const router = Router()

router.post("/register", register)

router.post("/login", login)

router.get("/me", protect, getMe)

router.post("/avatar", protect, upload.single("avatar"), uploadAvatar)

router.delete("/avatar", protect, deleteAvatar)

export default router