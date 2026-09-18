import { Request, Response } from "express";
import Project from "../models/Project";
import Task from "../models/Task";

export const createProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { title, description, color } = req.body;

    if (!title || !description || !color) {
      res.status(400).json({
        success: false,
        error: "Please provide project title, description, color",
      });
      return;
    }

    const project = await Project.create({
      title,
      description: description || "",
      color: color || "#3B82F6",
      owner: req.user!.id,
    });

    await project.populate("owner", "name email avatar");

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error creating project",
    });
  }
};

export const getProjects = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const filter: Record<string, unknown> = { owner: req.user!.id };

    if (req.query.includeArchived !== "true") {
      filter.isArchived = false;
    }

    const projects = await Project.find(filter)
      .populate("owner", "name email, avatar")
      .sort({ createdAt: -1 });

    const projectsWithTaskCount = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({ project: project._id });
        const completedCount = await Task.countDocuments({
          project: project._id,
          status: "done",
        });

        return {
          ...project.toObject(),
          taskCount,
          completedCount,
        };
      }),
    );

    res.status(200).json({
      success: true,
      count: projectsWithTaskCount.length,
      data: projectsWithTaskCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error fetching projects",
    });
  }
};

export const getProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "owner",
      "name email avatar",
    );

    if (!project) {
      res.status(404).json({
        success: false,
        error: `Project with ID ${req.params.id} not found`,
      });
      return;
    }

    if (project.owner.id.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: "You can only view your own projects",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: project,
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
      error: "Server error fetching project",
    });
  }
};

export const updateProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: `Project with ID ${req.params.id} not found`,
      });
      return;
    }

    if (project.owner.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: "You can only update your own projects",
      });
      return;
    }

    const { owner, ...updates } = req.body;

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true },
    ).populate("owner", "name email avatar");

    res.status(200).json({
      success: true,
      data: updatedProject,
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
      error: "Server error updating project",
    });
  }
};

export const deleteProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: `Project with ID ${req.params.id} not found`,
      });
      return;
    }

    if (project.owner.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: "You can only delete your own projects",
      });
      return;
    }

    const deletedTasks = await Project.deleteMany({ project: project._id });
    console.log(`Deleted ${deletedTasks.deletedCount} tasks`);

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Project and associated tasks deleted successfully",
      deletedTaskCount: deletedTasks.deletedCount,
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
      error: "Server error deleting project",
    });
  }
};

export const toggleArchive = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({
        success: false,
        error: `Project with ID ${req.params.id} not found`,
      });
      return;
    }

    if (project.owner.toString() !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: "You can only modify your own projects",
      });
      return;
    }

    project.isArchived = !project.isArchived;
    await project.save();

    res.status(200).json({
      success: true,
      message: project.isArchived ? "Project archived" : "Project unarchived",
      data: {
        id: project._id,
        isArchived: project.isArchived,
      },
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
      error: "Server error archiving project",
    });
  }
};
