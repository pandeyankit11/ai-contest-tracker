const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const codeforcesRoutes = require("./routes/codeforces.routes");
const platformRoutes = require("./routes/platform.routes");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/error.middleware");

const app = express();

app.use(cors());
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

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
