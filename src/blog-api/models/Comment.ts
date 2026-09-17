import mongoose, { Schema, Document, Types } from "mongoose";

export interface IComment extends Document {
  text: string;
  post: Types.ObjectId;
  author: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Comment must belong to a post"],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Comment must have an author"],
    },
  },
  { timestamps: true },
);

const Comment = mongoose.model<IComment>("Comment", commentSchema)

export default Comment