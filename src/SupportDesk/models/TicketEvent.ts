import { Schema, Types, model, type HydratedDocument } from "mongoose";

export type TicketEventType =
  | "created"
  | "status_changed"
  | "priority_changed"
  | "assigned"
  | "reassigned"
  | "comment_added";

export interface ITicketEvent {
  ticket: Types.ObjectId;
  actor: Types.ObjectId;
  type: TicketEventType;

  from?: string;
  to?: string;
  commentId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export type TicketEventDocument = HydratedDocument<ITicketEvent>;

const ticketEventSchema = new Schema<ITicketEvent>(
  {
    ticket: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: [true, "Ticket is required"],
      index: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Actor is required"],
      index: true,
    },
    type: {
      type: String,
      enum: [
        "created",
        "status_changed",
        "priority_changed",
        "assigned",
        "reassigned",
        "comment_added",
      ] as const,
      required: [true, "Event type is required"],
    },
    from: { type: String },
    to: { type: String },
    commentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
  },
  {
    timestamps: true,
  },
);

ticketEventSchema.index({ ticket: 1, createdAt: 1 });

ticketEventSchema.index({ actor: 1, createdAt: -1 });

export const TicketEvent = model<ITicketEvent>(
  "TicketEvent",
  ticketEventSchema,
);
