import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

export const generateToken = (userId: string): string => {
  const secret = ENV.JWT_SECRET;
  const expiresIn = "7d";

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in .env");
  }

  return jwt.sign({ id: userId }, secret, { expiresIn });
};

export const verifyToken = (token: string): { id: string } | null => {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string };
    return decoded;
  } catch (error) {
    return null;
  }
};
