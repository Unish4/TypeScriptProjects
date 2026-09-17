import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = ["PORT", "MONGO_URI", "JWT_SECRET", "NODE_ENV"];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

export const ENV = {
  PORT: process.env.PORT as string,
  MONGODB_URI: process.env.MONGODB_URI as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  NODE_ENV: process.env.NODE_ENV as string,
};

export const isDevelopment = ENV.NODE_ENV === "development";
