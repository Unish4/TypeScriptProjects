import { Schema, model, type HydratedDocument, Types } from "mongoose";

export interface IReview {
  recipe: Types.ObjectId;
  user: Types.ObjectId;
  rating: number; // 1..5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ReviewDocument = HydratedDocument<IReview>;

const reviewSchema = new Schema<IReview>(
  {
    recipe: {
      type: Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be between 1 and 5"],
      max: [5, "Rating must be between 1 and 5"],
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      maxlength: [500, "Comment must be at most 500 characters"],
    },
  },
  { timestamps: true },
);

reviewSchema.index({ recipe: 1, user: 1 }, { unique: true });

export const Review = model<IReview>("Review", reviewSchema);
