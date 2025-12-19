import dotenv from "dotenv";
dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  APP_ORIGIN: process.env.APP_ORIGIN || "http://localhost:8080",
  NODE_ENV: process.env.NODE_ENV || "development",
};

if (!env.DATABASE_URL) {
  console.warn("[WARN] DATABASE_URL is not set.");
}
if (!env.JWT_SECRET) {
  console.warn("[WARN] JWT_SECRET is not set.");
}
