import { Schema, Types, model, type HydratedDocument } from "mongoose";

export type PostStatus = "published" | "draft";

export interface IPost {
  author: Types.ObjectId;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  coverImage: { url: string; publicId: string } | undefined;
  status: PostStatus;
  publishedAt: Date | undefined;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PostDocument = HydratedDocument<IPost>;

const postSchema = new Schema<IPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
      index: true
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [150, "Title must be at most 150 characters"],
    },
    excerpt: {
      type: String,
      required: [true, "Excerpt is required"],
      trim: true,
      maxlength: [300, "Excerpt must be at most 300 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      maxlength: [1000, "Content must be at most 1000 characters"],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    coverImage: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "published"] as const,
        message: "{VALUES} is not a valid status",
      },
      default: "draft",
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

postSchema.index({ author: 1 });                 

postSchema.index({ title: "text", content: "text", tags: "text" });

postSchema.index({ status: 1, publishedAt: -1 });



export const Post = model<IPost>("Post", postSchema);
