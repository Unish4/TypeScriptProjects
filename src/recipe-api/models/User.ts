import { Schema, model, type HydratedDocument } from "mongoose";

export type UserRole = "user" | "admin";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: {
    url: string;
    publicId: string;
  };
  bio?: string;
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
      enum: ["user", "admin"] as const,
      default: "user",
    },
    avatar: {
      url: { type: String },
      publicId: { type: String },
    },
    bio: {
      type: String,
      maxlength: [200, "Bio must be at most 200 characters"],
    },
  },
  { timestamps: true },
);

export const User = model<IUser>("User", userSchema);
