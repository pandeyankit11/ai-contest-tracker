const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

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

const allowedOrigins = [];

if (env.nodeEnv === "development") {
  allowedOrigins.push("http://localhost:5173");
}

if (env.frontendUrl) {
  allowedOrigins.push(env.frontendUrl);
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
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

app.use("/api/auth", authRoutes);
app.use("/api/platforms", platformRoutes);
app.use("/api/codeforces", codeforcesRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
