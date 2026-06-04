const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { prisma } = require("./config/prisma");

const authRoutes = require("./routes/auth.routes");
const codeforcesRoutes = require("./routes/codeforces.routes");
const platformRoutes = require("./routes/platform.routes");
const contestRoutes = require("./routes/contest.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/error.middleware");
const { env } = require("./config/env");

const app = express();
app.use((req, res, next) => {
  console.log(`[GLOBAL] ${req.method} ${req.path}`);
  next();
});

// Hardcode your known safe URLs so it never fails, even if ENV variables mess up
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ai-contest-tracker.vercel.app",
  "https://www.ai-contest-tracker.vercel.app"
];

// Still add the ENV variable just in case, but strip any accidental trailing slashes
if (env.frontendUrl) {
  allowedOrigins.push(env.frontendUrl.replace(/\/$/, "")); 
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow server-to-server requests or tools like Postman
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // LOG the blocked origin so you can see exactly why it failed in Render logs
    console.error(`[CORS ERROR] Blocked request from unauthorized origin: ${origin}`);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true, // Crucial for JWTs
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "AI Contest Tracker Backend Running",
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    console.log("Route hit");

    await prisma.$connect();
    console.log("Connected");

    const result = await prisma.$queryRaw`SELECT NOW()`;

    console.log("RAW OK", result);

    res.json(result);
  } catch (err) {
    console.error("RAW ERROR", err);

    res.status(500).json({
      success: false,
      code: err.code,
      message: err.message,
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/platforms", platformRoutes);
app.use("/api/codeforces", codeforcesRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
