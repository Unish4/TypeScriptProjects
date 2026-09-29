import { Schema, Types, model, type HydratedDocument } from "mongoose";

export type LoanStatus = "active" | "returned";

export interface ILoan {
  book: Types.ObjectId;
  user: Types.ObjectId;
  borrowedAt: Date;
  dueAt: Date;
  returnedAt?: Date;
  status: LoanStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type LoanDocument = HydratedDocument<ILoan>;

const loanSchema = new Schema<ILoan>(
  {
    book: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: [true, "Book is required"],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    borrowedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    dueAt: {
      type: Date,
      required: true,
    },
    returnedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "returned"] as const,
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

// "My active loans" — user + status
loanSchema.index({ user: 1, status: 1, createdAt: -1 });

// "Active loans for this book" — book + status
loanSchema.index({ book: 1, status: 1 });

// "Overdue lookup" — dueAt for active loans
loanSchema.index({ status: 1, dueAt: 1 });

export const Loan = model<ILoan>("Loan", loanSchema);
