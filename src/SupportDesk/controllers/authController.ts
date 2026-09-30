import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User, type IUser, type UserDocument } from "../models/User";
import { generateToken } from "../utils/jwt";

export type PublicUser = Omit<IUser, "password"> & { _id: string };

export type UserSummary = Pick<IUser, "name" | "role" | "isActive"> & {
  _id: string;
};

export type AgentSummary = Pick<IUser, "name"> & { _id: string };

const toPublicUser = (user: UserDocument): PublicUser => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const toUserSummary = (user: UserDocument): UserSummary => ({
  _id: user._id.toString(),
  name: user.name,
  role: user.role,
  isActive: user.isActive,
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        error: "Name, email, and password are required",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });

    if (existing) {
      res.status(409).json({
        success: false,
        error: "Email already registered",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "customer",
      isActive: true,
    });

    const token = generateToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      data: {
        user: toPublicUser(user),
        token,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: unknown }).code === 11000
    ) {
      res.status(409).json({
        success: false,
        error: "Email already registered",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (!user) {
      res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
      return;
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: "Account is disabled",
      });
      return;
    }

    const token = generateToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      data: {
        user: toPublicUser(user),
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user: toPublicUser(user) },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch profile",
    });
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user: toUserSummary(user) },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch profile",
    });
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    const {name} = req.body as {name: string}

    if(typeof name ==="string" && name.trim().length >=2){
        user.name = name.trim()
    }

    await user.save()

    res.status(200).json({
        success: true,
        data: {user: toPublicUser(user)}
    })
  } catch (error) {
      res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    });
  }
};
