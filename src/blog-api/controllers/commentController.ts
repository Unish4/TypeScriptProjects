import { Request, Response } from "express";
import Comment from "../models/Comment";
import Post from "../models/Post";

export const createComment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const postId = Array.isArray(req.params.postId)
      ? req.params.postId[0]
      : req.params.postId;
    const { text } = req.body;

    if (!postId) {
      res.status(400).json({
        success: false,
        error: "Post ID is required",
      });
      return;
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: "Please provide comment text",
      });
      return;
    }

    const post = await Post.findById(postId);

    if (!post) {
      res.status(404).json({
        success: false,
        error: `Post with ID ${postId} not found`,
      });
      return;
    }

    const comment = await Comment.create({
      text: text.trim(),
      post: postId,
      author: req.user!.id,
    });

    await comment.populate("author", "name email");

    res.status(201).json({
      success: true,
      data: comment,
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
      error: "Server error creating comment",
    });
  }
};

export const getPostComments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const postId = Array.isArray(req.params.postId)
      ? req.params.postId[0]
      : req.params.postId;

    if (!postId) {
      res.status(400).json({
        success: false,
        error: "Post ID is required",
      });
      return;
    }

    const post = await Post.findById(postId);

    if (!post) {
      res.status(404).json({
        success: false,
        error: `Post with ID ${postId} not found`,
      });
      return;
    }

    const comments = await Comment.find({ post: postId })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
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
      error: "Server error fetching comments",
    });
  }
};

export const updateComment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const commentId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!commentId) {
      res.status(400).json({
        success: false,
        error: "Comment ID is required",
      });
      return;
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({
        success: false,
        error: `Comment with ID ${commentId} not found`,
      });
      return;
    }

    if (comment.author.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: "You can only update your own comments",
      });
      return;
    }

    const { text } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: "Please provide comment text",
      });
      return;
    }

    comment.text = text.trim();
    await comment.save();
    await comment.populate("author", "name email");

    res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "CastError") {
      res.status(400).json({
        success: false,
        error: "Invalid comment ID format",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Server error updating comment",
    });
  }
};

export const deleteComment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const commentId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!commentId) {
      res.status(400).json({
        success: false,
        error: "Comment ID is required",
      });
      return;
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({
        success: false,
        error: `Comment with ID ${commentId} not found`,
      });
      return;
    }

    if (comment.author.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: "You can only delete your own comments",
      });
      return;
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "CastError") {
      res.status(400).json({
        success: false,
        error: "Invalid comment ID format",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Server error deleting comment",
    });
  }
};