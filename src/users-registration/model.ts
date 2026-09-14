import { User, PublicUser } from "./types";
import { generateId } from "./utils";

const users: User[] = [];

export function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

export function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
}): User {
  const now = new Date().toISOString();

  const user: User = {
    id: generateId(),
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    role: data.role,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  users.push(user);
  return user;
}

export function findAllUsers(): User[] {
  return users;
}

export function findUserById(id: string): User | undefined {
  return users.find((user) => user.id === id);
}

export function findUserByEmail(email: string): User | undefined {
  return users.find((user) => user.email === email);
}

export function updateUser(
  id: string,
  updates: { name?: string; email?: string; role?: string; isActive?: boolean },
): User | undefined {
  const user = users.find((user) => user.id === id);

  if (!user) return undefined;

  if (updates.name !== undefined) user.name = updates.name;
  if (updates.email !== undefined) user.email = updates.email;
  if (updates.role !== undefined) user.role = updates.role;
  if (updates.isActive !== undefined) user.isActive = updates.isActive;

  user.updatedAt = new Date().toISOString();
  return user;
}

export function deleteUser(id: string): boolean {
  const index = users.findIndex((user) => user.id === id);

  if (index === -1) return false;

  users.splice(index, 1);
  return true;
}
