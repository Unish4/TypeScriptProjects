import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

export const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, ENV.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string): { id: string } | null => {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string };
    return decoded;
  } catch (error) {
    return null;
  }
};
