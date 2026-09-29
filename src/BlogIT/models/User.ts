import { Schema, model, type HydratedDocument } from "mongoose";

export type UserRole = "author" | "reader";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  bio?: string;
  avatar?: {
    url: string;
    publicId: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must be at most 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["author", "reader"] as const,
      default: "author",
    },
    bio: {
      type: String,
      maxlength: [300, "Bio must be at most 300 characters"],
    },
    avatar: {
      url: { type: String },
      publicId: { type: String },
    },
  },
  {
    timestamps: true,
  },
);

export const User = model<IUser>("User", userSchema);
