import { Schema, Types, model, type HydratedDocument } from "mongoose";

export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketCategory =
  | "billing"
  | "technical"
  | "account"
  | "feature_request"
  | "other";

const VALID_TRANSITUINS: Record<TicketStatus, TicketStatus[]> = {
  open: ["in_progress", "resolved", "closed"],
  in_progress: ["waiting", "resolved", "closed"],
  waiting: ["in_progress", "resolved", "closed"],
  resolved: ["closed", "in_progress"],
  closed: [],
};

export interface ITicket {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;

  createdBy: Types.ObjectId;
  assignedTo: Types.ObjectId | null;

  closedAt: Date | undefined;

  createdAt: Date;
  updatedAt: Date;
}

export type TicketDocument = HydratedDocument<ITicket>;

export const ticketSchema = new Schema<ITicket>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [150, "Title must be at most 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [5000, "Description must be at most 5000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "billing",
        "technical",
        "account",
        "feature_request",
        "other",
      ] as const,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"] as const,
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "waiting", "resolved", "closed"] as const,
      default: "open",
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "CreatedBy is required"],
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

ticketSchema.index({ createdBy: 1, createdAt: 1 });

ticketSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });

ticketSchema.index({ status: 1, priority: -1, createdAt: 1 });

ticketSchema.index({ closedAt: -1 });

ticketSchema.pre("save", function (next) {
  const ticket = this as TicketDocument;

  if (ticket.status === "closed" && !ticket.closedAt) {
    ticket.closedAt = new Date();
  }

  if (ticket.status !== "closed" && ticket.closedAt) {
    ticket.closedAt = undefined;
  }

  next();
});

export const Ticket = model<ITicket>("Ticket", ticketSchema);
