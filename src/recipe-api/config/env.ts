import dotenv from "dotenv";
dotenv.config()

const requiredEnvVars: string[] = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "NODE_ENV",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

export const ENV = {
  PORT: process.env.PORT as string,
  MONGO_URI: process.env.MONGO_URI as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  NODE_ENV: process.env.NODE_ENV as string,
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
    API_KEY: process.env.CLOUDINARY_API_KEY as string,
    API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
  },
};

export const isDevelopment = ENV.NODE_ENV === "development";
