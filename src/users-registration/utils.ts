import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export function generateId(): string {
  return randomUUID();
}
