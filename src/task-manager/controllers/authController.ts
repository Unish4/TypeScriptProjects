import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { generateToken } from "../utils/jwt";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinaryUpload";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        error: "Please provide name, email, and password",
      });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: "Email already registered",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during registration",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "Please provide email and password",
      });
      return;
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.status(400).json({
        success: false,
        error: "Invalid email or password",
      });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      res.status(400).json({
        success: false,
        error: "Invalid email or password",
      });
      return;
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during login",
    });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      res.status(401).json({
        success: false,
        error: "Not authorized",
      });
      return;
    }

    const user = await User.findById(currentUser.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Server error fetching profile",
    });
  }
};

export const uploadAvatar = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
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

    const user = await User.findById(currentUser.id);

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
        console.log(`Deleted old avatar: ${user.avatar.publicId}`);
      } catch (error) {
        console.error("Failed to delete old avatar:", error);
      }
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      "TaskManagerTS/avatars",
    );

    user.avatar = {
      url: result.url,
      publicId: result.publicId,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({
      success: false,
      error: "Server error uploading avatar",
    });
  }
};

export const deleteAvatar = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      res.status(401).json({
        success: false,
        error: "Not authorized",
      });
      return;
    }

    const user = await User.findById(currentUser.id);

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
      console.log(`Deleted avatar: ${user.avatar.publicId}`);
    } catch (error) {
      console.error("Failed to delete avatar:", error);
    }

    user.avatar = {
      url: "",
      publicId: "",
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar deleted successfully",
    });
  } catch (error) {
    console.error("Avatar delete error:", error);
    res.status(500).json({
      success: false,
      error: "Server error deleting avatar",
    });
  }
};
