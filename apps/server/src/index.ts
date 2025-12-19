import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import cors from "cors";
import { env } from "./env";
import { authRouter } from "./routes/auth";
import { adminRouter } from "./routes/admin";
import { contentRouter } from "./routes/content";

const app = express();

app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: false, // SPA + markdown preview simplicity for MVP
}));
app.use(morgan("combined"));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// If you split domains later, enable CORS. For single-container deployment, same-origin is used.
app.use(cors({
  origin: env.APP_ORIGIN,
  credentials: true,
}));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api", contentRouter);

// Serve frontend
const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir));

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`KB app listening on port ${port}`);
});
