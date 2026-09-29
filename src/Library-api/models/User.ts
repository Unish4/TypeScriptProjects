import { Schema, model, type HydratedDocument } from "mongoose";

export type UserRole = "member" | "librarian" | "admin";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
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
      enum: ["member", "librarian", "admin"] as const,
      default: "member",
    },
    avatar: {
      url: { type: String },
      publicId: { type: String },
    },
  },
  { timestamps: true },
);

export const User = model<IUser>("User", userSchema);
