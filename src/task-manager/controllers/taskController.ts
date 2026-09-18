import { Request, Response } from "express";
import Task from "../models/Task";
import Project from "../models/Project";
import User from "../models/User";

export const createTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const projectId = Array.isArray(req.params.projectId)
      ? req.params.projectId[0]
      : req.params.projectId;
    const { title, description, assignee, priority, dueDate } = req.body;

    if (!title || !assignee) {
      res.status(400).json({
        success: false,
        error: "Please provide title and assignee",
      });
      return;
    }

    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404).json({
        success: false,
        error: `Project with ID ${projectId} not found`,
      });
      return;
    }

    if (project.owner.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: "You can only add tasks to your own projects",
      });
      return;
    }

    const assigneeUser = await User.findById(assignee);

    if (!assigneeUser) {
      res.status(404).json({
        success: false,
        error: "Assignee user not found",
      });
      return;
    }

    const task = await Task.create({
      title,
      description: description || "",
      project: projectId,
      assignee,
      createdBy: req.user!.id,
      priority: priority || "medium",
      dueDate: dueDate || null,
    });

    await task.populate([
      { path: "assignee", select: "name email avatar" },
      { path: "createdBy", select: "name email avatar" },
      { path: "project", select: "title" },
    ]);

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "CastError") {
      res.status(400).json({
        success: false,
        error: "Invalid ID format",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Server error creating task",
    });
  }
};

// =============================================
// GET PROJECT TASKS
// GET /api/projects/:projectId/tasks
// Protected
// =============================================

export const getProjectTasks = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const projectId = Array.isArray(req.params.projectId)
      ? req.params.projectId[0]
      : req.params.projectId;

    // Check project exists
    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404).json({
        success: false,
        error: `Project with ID ${projectId} not found`,
      });
      return;
    }

    // Check access - only project owner can see all tasks
    // (In a real app, team members might also have access)
    if (project.owner.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: "You can only view tasks in your own projects",
      });
      return;
    }

    // Build filter
    const filter: Record<string, unknown> = { project: projectId };

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Filter by priority
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    // Filter by assignee
    if (req.query.assignee) {
      filter.assignee = req.query.assignee;
    }

    // Sort
    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (req.query.sort) {
      const sortField = (req.query.sort as string).replace("-", "");
      const sortOrder = (req.query.sort as string).startsWith("-") ? -1 : 1;
      sort = { [sortField]: sortOrder };
    }

    // Execute
    const tasks = await Task.find(filter)
      .populate("assignee", "name email avatar")
      .populate("createdBy", "name email avatar")
      .sort(sort);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "CastError") {
      res.status(400).json({
        success: false,
        error: "Invalid project ID format",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Server error fetching tasks",
    });
  }
};

export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const task = await Task.findById(taskId)
      .populate("assignee", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("project", "title owner");

    if (!task) {
      res.status(404).json({
        success: false,
        error: `Task with ID ${req.params.id} not found`,
      });
      return;
    }

    const project = task.project as unknown as {
      _id: string;
      owner: string;
      title: string;
    };
    if (project.owner.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: "You can only view tasks in your own projects",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "CastError") {
      res.status(400).json({
        success: false,
        error: "Invalid task ID format",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Server error fetching task",
    });
  }
};

export const updateTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const taskId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const task = await Task.findById(taskId).populate(
      "project",
      "owner",
    );

    if (!task) {
      res.status(404).json({
        success: false,
        error: `Task with ID ${req.params.id} not found`,
      });
      return;
    }

    const project = task.project as unknown as { owner: string };
    if (project.owner.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: "You can only update tasks in your own projects",
      });
      return;
    }

    const { project: _project, createdBy: _createdBy, ...updates } = req.body;

    if (updates.assignee) {
      const assigneeExists = await User.findById(updates.assignee);
      if (!assigneeExists) {
        res.status(404).json({
          success: false,
          error: "Assignee user not found",
        });
        return;
      }
    }

    if (updates.status === "done") {
      updates.completedAt = new Date();
    } else if (updates.status && updates.status !== "done") {
      updates.completedAt = null;
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, updates, {
      new: true,
      runValidators: true,
    })
      .populate("assignee", "name email avatar")
      .populate("createdBy", "name email avatar");

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "CastError") {
      res.status(400).json({
        success: false,
        error: "Invalid task ID format",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Server error updating task",
    });
  }
};

export const updateTaskStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { status } = req.body;

    const validStatuses = ["todo", "in-progress", "done"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(", ")}`,
      });
      return;
    }

    const task = await Task.findById(req.params.id).populate(
      "project",
      "owner",
    );

    if (!task) {
      res.status(404).json({
        success: false,
        error: `Task with ID ${req.params.id} not found`,
      });
      return;
    }

    const project = task.project as unknown as { owner: string };
    if (project.owner.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: "You can only update tasks in your own projects",
      });
      return;
    }

    task.status = status;
    if (status === "done") {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: `Task marked as ${status}`,
      data: {
        id: task._id,
        status: task.status,
        completedAt: task.completedAt,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "CastError") {
      res.status(400).json({
        success: false,
        error: "Invalid task ID format",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Server error updating task status",
    });
  }
};

export const deleteTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "project",
      "owner",
    );

    if (!task) {
      res.status(404).json({
        success: false,
        error: `Task with ID ${req.params.id} not found`,
      });
      return;
    }

    const project = task.project as unknown as { owner: string };
    if (project.owner.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: "You can only delete tasks in your own projects",
      });
      return;
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "CastError") {
      res.status(400).json({
        success: false,
        error: "Invalid task ID format",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Server error deleting task",
    });
  }
};
