import { Schema, Types, model, type HydratedDocument } from "mongoose";

export interface IComment {
  ticket: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CommentDocument = HydratedDocument<IComment>;

const commentSchema = new Schema<IComment>(
  {
    ticket: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: [true, "Ticket is required"],
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
      index: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [5000, "Comment must be at most 5000 characters"],
    },
    isInternal: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

commentSchema.index({ ticket: 1, isInternal: 1, createdAt: 1 });

export const Comment = model<IComment>("Comment", commentSchema);
