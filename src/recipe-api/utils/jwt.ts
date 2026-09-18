import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

export interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: "7d",
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, ENV.JWT_SECRET);

  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }

  const { id, name, email, role } = decoded as Partial<JwtPayload>;

  if (!id || !name || !email || !role) {
    throw new Error("Invalid token payload");
  }

  return { id, name, email, role };
};
