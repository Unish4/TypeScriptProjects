import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User, type IUser, type UserDocument } from "../models/User";
import { generateToken } from "../utils/jwt";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinaryUpload";

export type PublicUser = Omit<IUser, "password"> & { _id: string };

const toPublicUser = (user: UserDocument): PublicUser => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  bio: user.bio,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        error: "Name, email, and password are required",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
      return;
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: "Email already registered",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = generateToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      data: {
        user: toPublicUser(user),
        token,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: unknown }).code === 11000
    ) {
      res.status(409).json({
        success: false,
        error: "Email already registered",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (!user) {
      res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
      return;
    }

    const token = generateToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      data: {
        user: toPublicUser(user),
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Not authorized",
      });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: toPublicUser(user),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch profile",
    });
  }
};

export const uploadAvatar = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Not authorized",
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: "Please upload an image file",
      });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    if (user.avatar?.publicId) {
      try {
        await deleteFromCloudinary(user.avatar.publicId);
      } catch (error) {
        console.error("Failed to delete old avatar:", error);
      }
    }

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      "recipe-app/avatars",
    );

    user.avatar = {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        avatar: user.avatar,
        user: toPublicUser(user),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Avatar upload failed",
    });
  }
};

export const deleteAvatar = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Not authorized",
      });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    if (!user.avatar?.publicId) {
      res.status(400).json({
        success: false,
        error: "No avatar to delete",
      });
      return;
    }

    try {
      await deleteFromCloudinary(user.avatar.publicId);
    } catch (error) {
      console.error("Failed to delete avatar:", error);
    }

    user.avatar = { url: "", publicId: "" };
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Avatar delete failed",
    });
  }
};

