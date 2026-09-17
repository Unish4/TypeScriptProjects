import { Request, Response } from "express";
import Post from "../models/Post";

export const createPost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { title, content, tags, isPublished } = req.body;

    if (!title || !content) {
      res.status(400).json({
        success: false,
        error: "Please provide title and content",
      });
      return;
    }

    const post = await Post.create({
      title,
      content,
      tags: tags || [],
      isPublished: isPublished || false,
      author: req.user!.id,
    });

    await post.populate("author", "name email");

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error creating post",
    });
  }
};

export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};

    if (req.query.includeDrafts !== "true") {
      filter.isPublished = true;
    }

    if (req.query.author) {
      filter.author = req.query.author;
    }

    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, "i");
      filter.$or = [{ title: searchRegex }, { content: searchRegex }];
    }

    const page = Number(req.query.page as string) || 1;
    const limit = Number(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find(filter)
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: posts.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
      data: posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error fetching posts",
    });
  }
};

export const getPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "name email",
    );

    if (!post) {
      res.status(400).json({
        success: false,
        error: `Post with ID ${req.params.id} not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "CastError") {
      res.status(400).json({
        success: false,
        error: "Invalid post ID format",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Server error fetching post",
    });
  }
};

export const updatePost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(400).json({
        success: false,
        error: `Post with ID ${req.params.id} not found`,
      });
      return;
    }

    if (post.author.id.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: "You can only update your own posts",
      });
      return;
    }

    const { author, ...updateData } = req.body;

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    ).populate("author", "name email");

    res.status(200).json({
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "CastError") {
      res.status(400).json({
        success: false,
        error: "Invalid post ID format",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Server error updating post",
    });
  }
};

export const deletePost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({
        success: false,
        error: `Post with ID ${req.params.id} not found`,
      });
      return;
    }

    if (post.author.id.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: "You can only delete your own posts",
      });
      return;
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "CastError") {
      res.status(400).json({
        success: false,
        error: "Invalid post ID format",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Server error deleting post",
    });
  }
};
