import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User, type IUser, type UserDocument } from "../models/User";
import { generateToken } from "../utils/jwt";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinaryUpload";

export type PublicUser = Omit<IUser, "password"> & { _id: string };
export type UserSummary = Pick<IUser, "_id" | "name" | "avatar" | "role"> & {
  _id: string;
};

const toPublicUser = (user: UserDocument) => ({})