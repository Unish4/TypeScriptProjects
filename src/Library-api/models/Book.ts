import { Schema, model, type HydratedDocument } from "mongoose";

export interface IBook {
  title: string;
  author: string;
  isbn: string;
  genre: string;
  description: string;
  coverImage?: {
    url: string;
    publicId: string;
  };
  totalCopies: number;
  availableCopies: number;
  createdAt: Date;
  updatedAt: Date;
}

export type BookDocument = HydratedDocument<IBook>;

const bookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [1, "Title is required"],
      maxlength: [200, "Title must be at most 200 characters"],
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
      maxlength: [120, "Author must be at most 120 characters"],
    },
    isbn: {
      type: String,
      required: [true, "ISBN is required"],
      unique: true,
      trim: true,
    },
    genre: {
      type: String,
      required: [true, "Genre is required"],
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description must be at most 2000 characters"],
    },
    coverImage: {
      url: { type: String },
      publicId: { type: String },
    },
    totalCopies: {
      type: Number,
      required: [true, "totalCopies is required"],
      min: [1, "Library must have at least 1 copy"],
    },
    availableCopies: {
      type: Number,
      required: [true, "availableCopies is required"],
      min: [0, "availableCopies cannot be negative"],
    },
  },
  { timestamps: true },
);


// Text search on title + description (one text index per collection)
bookSchema.index({ title: "text", description: "text" });

// Compound for filter+sort on genre
bookSchema.index({ genre: 1, title: 1 });


bookSchema.pre("save", function (next) {
  const book = this as BookDocument;

  if (book.availableCopies > book.totalCopies) {
    return next(new Error("availableCopies cannot exceed totalCopies"));
  }
  if (book.availableCopies < 0) {
    return next(new Error("availableCopies cannot be negative"));
  }

  next();
});

export const Book = model<IBook>("Book", bookSchema);
