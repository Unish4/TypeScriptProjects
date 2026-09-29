import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars: string[] = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "NODE_ENV",
];

requiredEnvVars.forEach((v) => {
  if (!process.env[v]) {
    throw new Error(`Missing required environment variable: ${v}`);
  }
});

export const ENV = {
  PORT: process.env.PORT as string,
  MONGO_URI: process.env.MONGO_URI as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  NODE_ENV: process.env.NODE_ENV as string,
};

export const isDevelopment = ENV.NODE_ENV === "development";
