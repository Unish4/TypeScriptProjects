import { TicketEvent, type TicketEventType } from "../models/TicketEvent";
import type { Types } from "mongoose";

interface LogEventParams {
  ticket: Types.ObjectId;
  actor: string;
  type: TicketEventType;
  from?: string;
  to?: string;
  commentId?: Types.ObjectId;
}

export const logTicketEvent = async (params: LogEventParams): Promise<void> => {
  try {
    await TicketEvent.create({
      ticket: params.ticket,
      actor: params.actor,
      type: params.type,
      from: params.from,
      to: params.to,
      commentId: params.commentId,
    });
  } catch (error) {
    console.error("Failed to log ticket event:", error);
  }
};
