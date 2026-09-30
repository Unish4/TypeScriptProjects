import type { Request, Response } from "express";
import { Types, type FilterQuery } from "mongoose";
import {
  Ticket,
  type ITicket,
  VALID_TRANSITIONS,
  type TicketStatus,
  type TicketPriority,
  type TicketCategory,
} from "../models/Ticket";
import { Comment } from "../models/Comment";
import { TicketEvent } from "../models/TicketEvent";
import { User, type IUser } from "../models/User";
import { paginate } from "../utils/paginate";
import { logTicketEvent } from "../utils/ticketEvents";
import { assertNever } from "../utils/assertNever";

type PopulatedUser = Pick<IUser, "_id" | "name" | "role">;

export type PopulatedTicket = Omit<ITicket, "createdBy" | "assignedTo"> & {
  createdBy: PopulatedUser;
  assignedTo: PopulatedUser | null;
};

const VALID_STATUSES: TicketStatus[] = [
  "open",
  "in_progress",
  "waiting",
  "resolved",
  "closed",
];
const VALID_PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];
const VALID_CATEGORIES: TicketCategory[] = [
  "billing",
  "technical",
  "account",
  "feature_request",
  "other",
];

const isStatus = (v: unknown): v is TicketStatus => {
  return typeof v === "string" && (VALID_STATUSES as string[]).includes(v);
};

const isPriority = (v: unknown): v is TicketPriority =>
  typeof v === "string" && (VALID_PRIORITIES as string[]).includes(v);

const isCategory = (v: unknown): v is TicketCategory =>
  typeof v === "string" && (VALID_CATEGORIES as string[]).includes(v);

const canAccessTicket = (
  ticket: { createdBy: Types.ObjectId; assignedTo: Types.ObjectId | null },
  user: { id: string; role: string },
): boolean => {
  switch (user.role) {
    case "admin":
      return true;
    case "agent":
      return (
        ticket.assignedTo === null || ticket.assignedTo.toString() === user.id
      );
    case "customer":
      return ticket.createdBy.toString() === user.id;
    default:
      return assertNever(user.role as never);
  }
};

export const createTicket = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
      return;
    }

    const { title, description, category, priority } = req.body as {
      title?: string;
      descriptiom?: string;
      category?: string;
      priority?: string;
    };

    if (!title || title.trim().length < 5 || title.length > 150) {
      res.status(400).json({
        success: false,
        error: "Title must be between 5 and 150 characters",
      });
      return;
    }

    if (
      !description ||
      description.trim().length < 10 ||
      description.length > 5000
    ) {
      res.status(400).json({
        success: false,
        error: "Description must be between 10 and 5000 characters",
      });
      return;
    }
    if (!isCategory(category)) {
      res.status(400).json({
        success: false,
        error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}`,
      });
      return;
    }

    const finalPriority: TicketPriority = isPriority(priority)
      ? priority
      : "medium";

    const ticket = await Ticket.create({
      title: title.trim(),
      description: description.trim(),
      category,
      priority: finalPriority,
      status: "open",
      createdBy: req.user.id,
      assignedTo: null,
    });

    await logTicketEvent({
      ticket: ticket._id,
      actor: req.user.id,
      type: "created",
    });

    res.status(201).json({
      success: true,
      data: { ticket },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create ticket",
    });
  }
};

export const listTickets = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Not authenticated" });
      return;
    }

    const query = req.query as Record<string, string | undefined>;

    const statusParam = query.status;
    const priorityParam = query.priority;
    const categoryParam = query.category;
    const assignedToParam = query.assignedTo;

    const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(query.limit ?? "20", 10) || 20),
      x,
    );

    
  } catch (error) {}
};
