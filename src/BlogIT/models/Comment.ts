import { Schema, Types, model, type HydratedDocument } from "mongoose";

export interface IComment {
  post: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CommentDocument = HydratedDocument<IComment>;

const commentSchema = new Schema<IComment>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Post is required"],
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
      minlength: [1, "Comment must have atleast 1 character"],
      maxlength: [250, "Comment can have at max 250 character"],
    },
  },
  {
    timestamps: true,
  },
);

commentSchema.index({ post: 1, createdAt: -1 });

export const Comment = model<IComment>("Comment", commentSchema);
