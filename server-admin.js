// server-admin.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const session = require("express-session");
const { Server } = require("socket.io");
const SQLiteCloud = require("@sqlitecloud/drivers"); // correct driver
const bcrypt = require("bcryptjs");

const app = express();
const server = http.createServer(app);

/* ===========================
   ENV
=========================== */
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret";
const SQLITECLOUD_URL = process.env.SQLITECLOUD_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

if (!SQLITECLOUD_URL) {
  console.error("❌ SQLITECLOUD_URL is not set");
  process.exit(1);
}

/* ===========================
   DB
=========================== */
let db;
let isCloudDB = false;

try {
  db = new SQLiteCloud.Database(SQLITECLOUD_URL);
  isCloudDB = true;
  console.log("✅ Connected to SQLiteCloud");
} catch (err) {
  console.error("❌ SQLiteCloud connection failed:", err);
  process.exit(1);
}

/* ===========================
   SOCKET.IO
=========================== */
const io = new Server(server, {
  cors: { origin: FRONTEND_URL, methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);
  socket.on("disconnect", () => console.log("🔴 Client disconnected:", socket.id));
});

/* ===========================
   PATHS
=========================== */
const BUILD_PATH = path.join(__dirname, "inc-voting-ui", "build");
const PUBLIC_PATH = path.join(__dirname, "public");
const ADMIN_PATH = path.join(__dirname, "admin-panel");

/* ===========================
   MIDDLEWARE
=========================== */
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

app.use("/public", express.static(PUBLIC_PATH));
app.use("/admin", express.static(ADMIN_PATH));
if (fs.existsSync(BUILD_PATH)) app.use(express.static(BUILD_PATH));

/* ===========================
   HELPERS
=========================== */
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: "Unauthorized" });
}

// Normalize SQLiteCloud result
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

async function dbRun(sql, params = []) {
  const result = await db.sql(sql, ...params);
  return { lastID: result.lastRowid || 0, changes: result.rowsChanged || 0 };
}

/* ===========================
   AUTH
=========================== */
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await dbGet("SELECT * FROM admin_users WHERE username = ?", [username]);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    if (!bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: "Invalid credentials" });

    req.session.admin = { id: user.id, username: user.username };
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

/* ===========================
   API ROUTES
=========================== */
// Health
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Positions
app.get("/api/positions", async (req, res) => {
  try {
    const positions = await dbAll("SELECT * FROM positions ORDER BY display_order");
    const result = [];
    for (const p of positions) {
      const candidates = await dbAll(
        "SELECT id, name, image_url FROM candidates WHERE position_id = ? ORDER BY display_order",
        [p.id]
      );
      result.push({ ...p, candidates });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch positions" });
  }
});

// Vote
app.post("/api/vote", async (req, res) => {
  const { voter_id, candidate_id } = req.body;
  try {
    await dbRun("INSERT INTO votes (delegate_id, candidate_id) VALUES (?, ?)", [
      voter_id,
      candidate_id,
    ]);
    io.emit("vote_update");
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Vote failed" });
  }
});

/* ===========================
   SERVE REACT
=========================== */
if (fs.existsSync(BUILD_PATH)) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(BUILD_PATH, "index.html"));
  });
} else {
  app.get("/", (req, res) => res.send("⚠️ React build not found. Run 'npm run build'."));
}

/* ===========================
   START SERVER
=========================== */
server.listen(PORT, () => {
  console.log(`🚀 INC Voting System Running on port ${PORT}`);
  console.log(`🌐 Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`💻 Frontend URL: ${FRONTEND_URL}`);
  console.log(`💾 Database: ${isCloudDB ? "SQLiteCloud" : "Local SQLite"}`);
});
