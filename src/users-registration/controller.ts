import { Request, Response } from "express";
import * as model from "./model";
import { hashPassword } from "./utils";
import { PublicUser } from "./types";

export const createUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: "Please provide name, email, and password",
    });
  }

  const existing = model.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({
      success: false,
      error: "Email already registered",
    });
  }

  const passwordHash = await hashPassword(password);

  const user = model.createUser({
    name,
    email,
    passwordHash,
    role: "user",
  });

  const publicUser = model.toPublicUser(user);

  res.status(201).json({
    success: true,
    data: publicUser,
  });
};

export const getUsers = (req: Request, res: Response) => {
  const users = model.findAllUsers();

  const publicUsers = users.map(model.toPublicUser);

  res.status(200).json({
    success: true,
    count: publicUsers.length,
    data: publicUsers,
  });
};

export const getUser = (req: Request, res: Response) => {
  const user = model.findUserById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: `User with ID ${req.params.id} not found`,
    });
  }

  const publicUser = model.toPublicUser(user);

  res.status(200).json({
    success: true,
    data: publicUser,
  });
};

export const updateUser = (req: Request, res: Response) => {
  const existing = model.findUserById(req.params.id);

  if (!existing) {
    return res.status(404).json({
      success: false,
      error: `User with ID ${req.params.id} not found`,
    });
  }

  const { name, email } = req.body;

  if (email && email !== existing.email) {
    const userWithEmail = model.findUserByEmail(email);
    if (userWithEmail) {
      res.status(400).json({
        success: false,
        error: "Email already in use",
      });
      return;
    }
  }

  const updated = model.updateUser(req.params.id, { name, email });

  const publicUser = model.toPublicUser(updated);

  res.status(200).json({
    success: true,
    data: publicUser,
  });
};

export function deleteUser(req: Request, res: Response) {
  // Step 1: Call model to delete
  const deleted = model.deleteUser(req.params.id);

  // Step 2: Check if found
  if (!deleted) {
    res.status(404).json({
      success: false,
      error: `User with ID ${req.params.id} not found`,
    });
    return;
  }

  // Step 3: Send response
  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
}
