import { Request, Response } from "express";
import User from "../models/User";
import Post from "../models/Post";

export const getUserProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        error: `User with ID ${req.params.id} not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "CastError") {
      res.status(400).json({
        success: false,
        error: "Invalid user ID format",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Server error fetching user profile",
    });
  }
};

export const getUserPosts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        error: `User with ID ${req.params.id} not found`,
      });
      return;
    }

    const posts = await Post.find({
      author: req.params.id,
      isPublished: true,
    })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "CastError") {
      res.status(400).json({
        success: false,
        error: "Invalid user ID format",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Server error fetching user posts",
    });
  }
};

export const getAllUsers = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error fetching users",
    });
  }
};
