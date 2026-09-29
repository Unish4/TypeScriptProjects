import { Schema, Types, model, type HydratedDocument } from "mongoose";

export type ReservationStatus = "waiting" | "fulfilled" | "cancelled";

export interface IReservation {
  book: Types.ObjectId;
  user: Types.ObjectId;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ReservationDocument = HydratedDocument<IReservation>;

const reservationSchema = new Schema<IReservation>(
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
    status: {
      type: String,
      enum: ["waiting", "fulfilled", "cancelled"] as const,
      default: "waiting",
      index: true,
    },
  },
  { timestamps: true },
);

// One reservation per user per book
reservationSchema.index({ book: 1, user: 1 }, { unique: true });

// FIFO queue per book — for "next in line" lookup
reservationSchema.index({ book: 1, status: 1, createdAt: 1 });

export const Reservation = model<IReservation>(
  "Reservation",
  reservationSchema,
);
