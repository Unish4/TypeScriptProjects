import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProject extends Document {
  title: string;
  description: string;
  owner: Types.ObjectId;
  color: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project must have an owner"],
    },
    color: {
      type: String,
      default: "#3B82F6",
      match: [
        /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        "Color must be a valid hex code",
      ],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Project = mongoose.model<IProject>("Project", projectSchema);

export default Project;
