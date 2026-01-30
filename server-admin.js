require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const session = require("express-session");
const { Server } = require("socket.io");
const SQLiteCloud = require("@sqlitecloud/drivers");
const bcrypt = require("bcryptjs");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 10000;
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret";
const SQLITECLOUD_URL = process.env.SQLITECLOUD_URL || process.env.SQLITE_CLOUD_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

// Database Connection
if (!SQLITECLOUD_URL) {
  console.error("❌ SQLITECLOUD_URL is not set");
  process.exit(1);
}
const db = new SQLiteCloud.Database(SQLITECLOUD_URL);

// Middleware
app.set("trust proxy", 1);
app.use(express.json({ limit: "20mb" }));
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(session({
  name: "inc.sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
}));

// Path Definitions
const BUILD_PATH = path.join(__dirname, "inc-voting-ui", "build");
const ADMIN_PATH = path.join(__dirname, "admin-panel");

// Auth Helpers
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: "Unauthorized" });
}

async function dbAll(sql, params = []) {
  const res = await db.sql(sql, ...params);
  if (!res || !res.columns || !res.data) return [];
  return res.data.map((row) => {
    const obj = {};
    res.columns.forEach((col, i) => (obj[col] = row[i]));
    return obj;
  });
}

async function dbGet(sql, params = []) {
  const all = await dbAll(sql, params);
  return all[0] || null;
}

/* ===========================
   CONSOLIDATED AUTH ROUTES
=========================== */

app.get("/admin/auth-status", (req, res) => {
  res.json({ authenticated: !!req.session.admin, username: req.session.admin?.username || null });
});

app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await dbGet("SELECT * FROM admin_users WHERE username = ?", [username]);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    req.session.admin = { id: user.id, username: user.username };
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("inc.sid");
    res.json({ success: true });
  });
});

/* ===========================
   ADMIN API ROUTES
=========================== */

app.get("/admin/stats", requireAdmin, async (req, res) => {
  const total_delegates = (await dbGet("SELECT COUNT(*) as c FROM delegates"))?.c || 0;
  const voted_delegates = (await dbGet("SELECT COUNT(*) as c FROM delegates WHERE has_voted = 1"))?.c || 0;
  res.json({ total_delegates, voted_delegates });
});

// Static Serving
app.use("/admin", express.static(ADMIN_PATH));
if (fs.existsSync(BUILD_PATH)) {
  app.use(express.static(BUILD_PATH));
  app.get("*", (req, res) => res.sendFile(path.join(BUILD_PATH, "index.html")));
}

server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));