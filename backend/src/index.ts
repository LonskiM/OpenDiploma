import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import "dotenv/config";
import { prisma } from "./utils/prisma";
import { logger } from "./utils/logger";
import authRoutes from "./routes/auth.routes";
import courseRoutes from "./routes/course.routes";
import lessonRoutes from "./routes/lesson.routes";
import testRoutes from "./routes/test.routes";
import progressRoutes from "./routes/progress.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(helmet());
app.use(
    cors({
        credentials: true,
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error("Not allowed by CORS"));
        },
    })
);
app.use(express.json({ limit: "100kb" }));
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 300,
        standardHeaders: true,
        legacyHeaders: false,
    })
);
app.use((req, res, next) => {
    const requestId = req.headers["x-request-id"]?.toString() ?? crypto.randomUUID();
    res.setHeader("x-request-id", requestId);
    next();
});

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/courses", courseRoutes);
app.use("/", lessonRoutes);
app.use("/", testRoutes);
app.use("/", progressRoutes);

app.get("/", (req, res) => {
    res.send("API is running!");
});
app.get("/healthz", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, "[api] Server running");
});

const shutdown = async (signal: string) => {
    logger.info({ signal }, "[api] Shutting down");
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
};

process.on("SIGINT", () => {
    void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
});