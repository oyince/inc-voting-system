// server-admin.js
// Complete server with Admin Panel + Voting System (SQLiteCloud Compatible)

require('dotenv').config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const QRCode = require("qrcode");

const app = express();
const server = http.createServer(app);

// Get environment variables
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";
const SQLITE_CLOUD_URL = process.env.SQLITE_CLOUD_URL;
const SESSION_SECRET = process.env.SESSION_SECRET || 'inc-voting-secret-2025';

// Socket.IO for live updates
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

// Initialize database connection (SQLiteCloud or local SQLite)
let db;
let isCloudDatabase = false;

if (SQLITE_CLOUD_URL) {
  console.log('🌩️  Connecting to SQLiteCloud...');
  const { Database } = require('@sqlitecloud/drivers');
  db = new Database(SQLITE_CLOUD_URL);
  isCloudDatabase = true;
  console.log('✅ Connected to SQLiteCloud');
} else {
  console.log('📁 Using local SQLite database...');
  const sqlite3 = require("sqlite3").verbose();
  db = new sqlite3.Database("./inc_votes.db");
  console.log('✅ Connected to local SQLite');
}

// Helper to normalize SQLiteCloud results to standard format
function normalizeCloudResult(result) {
  if (!result) return null;
  
  // If it's already an array of objects, return as is
  if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'object') {
    return result;
  }
  
  // If it's a SQLiteCloud result object
  if (result.data && result.columns) {
    const rows = [];
    for (let i = 0; i < result.data.length; i++) {
      const row = {};
      for (let j = 0; j < result.columns.length; j++) {
        row[result.columns[j]] = result.data[i][j];
      }
      rows.push(row);
    }
    return rows;
  }
  
  // If it's a single row object
  if (typeof result === 'object' && !Array.isArray(result)) {
    return result;
  }
  
  return result;
}

// Helper functions to handle both SQLiteCloud and sqlite3 API
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (isCloudDatabase) {
      // SQLiteCloud
      db.sql(sql, ...params)
        .then(result => {
          // Get last insert ID or changes count
          const lastID = result?.lastRowid || result?.lastID || 0;
          const changes = result?.rowsChanged || result?.changes || 0;
          resolve({ lastID, changes });
        })
        .catch(err => reject(err));
    } else {
      // sqlite3
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    }
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (isCloudDatabase) {
      // SQLiteCloud
      db.sql(sql, ...params)
        .then(result => {
          const normalized = normalizeCloudResult(result);
          const row = Array.isArray(normalized) ? normalized[0] : normalized;
          resolve(row || null);
        })
        .catch(err => reject(err));
    } else {
      // sqlite3
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    }
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (isCloudDatabase) {
      // SQLiteCloud
      db.sql(sql, ...params)
        .then(result => {
          const normalized = normalizeCloudResult(result);
          const rows = Array.isArray(normalized) ? normalized : (normalized ? [normalized] : []);
          resolve(rows);
        })
        .catch(err => reject(err));
    } else {
      // sqlite3
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    }
  });
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.static("public"));
app.use("/admin", express.static("admin-panel"));

// Session management
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './public/candidates';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Initialize database tables
async function initializeTables() {
  try {
    // Create admin users table if it doesn't exist
    await dbRun(`CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Check if default admin exists
    const existingAdmin = await dbGet('SELECT * FROM admin_users WHERE id = ?', [1]);
    
    if (!existingAdmin) {
      // Create default admin user
      const defaultPassword = bcrypt.hashSync('admin123', 10);
      await dbRun(
        `INSERT INTO admin_users (id, username, password_hash) VALUES (?, ?, ?)`,
        [1, 'admin', defaultPassword]
      );
      console.log('✅ Default admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }

    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ Error initializing tables:', err.message);
  }
}

// Initialize tables on startup
initializeTables();

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session.adminId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// ============= AUTH ROUTES =============

app.get('/admin/auth-status', async (req, res) => {
  if (req.session.adminId) {
    try {
      const user = await dbGet('SELECT username FROM admin_users WHERE id = ?', [req.session.adminId]);
      if (user) {
        res.json({ authenticated: true, username: user.username });
      } else {
        res.json({ authenticated: false });
      }
    } catch (err) {
      console.error('Auth status error:', err);
      res.json({ authenticated: false });
    }
  } else {
    res.json({ authenticated: false });
  }
});

app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await dbGet('SELECT * FROM admin_users WHERE username = ?', [username]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    if (bcrypt.compareSync(password, user.password_hash)) {
      req.session.adminId = user.id;
      res.json({ success: true, username: user.username });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ============= ADMIN STATS =============

app.get('/admin/stats', requireAuth, async (req, res) => {
  try {
    // Get counts separately for better compatibility
    const delegatesCount = await dbGet('SELECT COUNT(*) as count FROM delegates');
    const votedCount = await dbGet('SELECT COUNT(*) as count FROM delegates WHERE has_voted = 1');
    const candidatesCount = await dbGet('SELECT COUNT(*) as count FROM candidates');
    const votesCount = await dbGet('SELECT COUNT(*) as count FROM votes');
    
    const stats = {
      total_delegates: delegatesCount?.count || 0,
      voted_delegates: votedCount?.count || 0,
      total_candidates: candidatesCount?.count || 0,
      total_votes: votesCount?.count || 0
    };
    
    console.log('Stats:', stats);
    res.json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============= ADMIN DELEGATES =============

app.get('/admin/delegates', requireAuth, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM delegates ORDER BY id DESC');
    console.log('Delegates loaded:', rows.length);
    res.json({ delegates: rows, total: rows.length });
  } catch (err) {
    console.error('Delegates error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/delegates', requireAuth, async (req, res) => {
  const { name, gender, community, zone, phone, email } = req.body;
  const token = `INC-1-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  
  try {
    const result = await dbRun(
      'INSERT INTO delegates (name, gender, community, zone, phone, email, token, has_voted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, gender, community, zone, phone, email, token, 0]
    );
    
    const delegate = await dbGet('SELECT * FROM delegates WHERE token = ?', [token]);
    res.json({ success: true, delegate });
  } catch (err) {
    console.error('Add delegate error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/admin/delegates/:id', requireAuth, async (req, res) => {
  try {
    await dbRun('DELETE FROM delegates WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete delegate error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/delegates/import', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const Papa = require('papaparse');
  const csv = fs.readFileSync(req.file.path, 'utf8');
  
  Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      let count = 0;
      
      try {
        for (const row of results.data) {
          if (row.name && row.zone) {
            const token = `INC-1-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
            await dbRun(
              'INSERT INTO delegates (name, gender, community, zone, phone, email, token, has_voted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [row.name, row.gender, row.community, row.zone, row.phone, row.email, token, 0]
            );
            count++;
          }
        }
        
        fs.unlinkSync(req.file.path);
        res.json({ success: true, count });
      } catch (err) {
        console.error('Import error:', err);
        res.status(500).json({ error: err.message });
      }
    }
  });
});

// ============= ADMIN CANDIDATES =============

app.get('/admin/candidates', requireAuth, async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT 
        c.*,
        p.title as position_title,
        p.zone as position_zone
      FROM candidates c
      JOIN positions p ON c.position_id = p.id
      ORDER BY p.display_order, c.display_order
    `);
    console.log('Candidates loaded:', rows.length);
    res.json(rows);
  } catch (err) {
    console.error('Candidates error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/admin/positions', requireAuth, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM positions ORDER BY display_order');
    res.json(rows);
  } catch (err) {
    console.error('Positions error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/candidates', requireAuth, upload.single('image'), async (req, res) => {
  const { position_id, name, gender, community, zone } = req.body;
  const image_url = req.file ? `/candidates/${req.file.filename}` : null;
  
  try {
    const row = await dbGet(
      'SELECT MAX(display_order) as max_order FROM candidates WHERE position_id = ?',
      [position_id]
    );
    const display_order = (row?.max_order || 0) + 1;
    
    const result = await dbRun(
      'INSERT INTO candidates (position_id, name, gender, community, zone, image_url, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [position_id, name, gender, community, zone, image_url, display_order]
    );
    
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    console.error('Add candidate error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/admin/candidates/:id', requireAuth, async (req, res) => {
  try {
    const row = await dbGet('SELECT image_url FROM candidates WHERE id = ?', [req.params.id]);
    if (row && row.image_url) {
      const filePath = path.join(__dirname, 'public', row.image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await dbRun('DELETE FROM candidates WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete candidate error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/admin/candidates/:id', requireAuth, upload.single('image'), async (req, res) => {
  const { position_id, gender, community, zone } = req.body;
  const candidateId = req.params.id;
  
  try {
    let image_url = null;
    if (req.file) {
      image_url = `/candidates/${req.file.filename}`;
      
      const oldCandidate = await dbGet('SELECT image_url FROM candidates WHERE id = ?', [candidateId]);
      if (oldCandidate && oldCandidate.image_url) {
        const oldPath = path.join(__dirname, 'public', oldCandidate.image_url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      
      await dbRun(
        'UPDATE candidates SET position_id = ?, gender = ?, community = ?, zone = ?, image_url = ? WHERE id = ?',
        [position_id, gender, community, zone, image_url, candidateId]
      );
    } else {
      await dbRun(
        'UPDATE candidates SET position_id = ?, gender = ?, community = ?, zone = ? WHERE id = ?',
        [position_id, gender, community, zone, candidateId]
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Update candidate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============= QR CODE GENERATION =============

app.post('/admin/qr-codes/generate', requireAuth, async (req, res) => {
  try {
    const delegates = await dbAll('SELECT * FROM delegates ORDER BY id');
    
    const qrDir = './public/qr-codes';
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }
    
    let count = 0;
    for (const delegate of delegates) {
      try {
        const filename = `${delegate.id}_${delegate.name.replace(/\s+/g, '_')}.png`;
        const filepath = path.join(qrDir, filename);
        await QRCode.toFile(filepath, delegate.token);
        count++;
      } catch (error) {
        console.error('QR generation error:', error);
      }
    }
    
    res.json({ success: true, count });
  } catch (err) {
    console.error('Generate QR error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/admin/qr-codes/download-all', requireAuth, async (req, res) => {
  try {
    const delegates = await dbAll('SELECT * FROM delegates ORDER BY id');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>INC Delegate QR Codes</title>
  <style>
    body { font-family: Arial; padding: 20px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .card { border: 2px solid #333; padding: 15px; text-align: center; page-break-inside: avoid; }
    .card img { max-width: 100%; }
    .name { font-weight: bold; margin: 10px 0; }
    .token { font-family: monospace; font-size: 12px; background: #f0f0f0; padding: 5px; }
    @media print { .grid { gap: 10px; } }
  </style>
</head>
<body>
  <h1>INC Delegate QR Codes</h1>
  <div class="grid">
    ${delegates.map(d => `
    <div class="card">
      <img src="/qr-codes/${d.id}_${d.name.replace(/\s+/g, '_')}.png" alt="${d.name}">
      <div class="name">${d.name}</div>
      <div class="token">${d.token}</div>
    </div>
    `).join('')}
  </div>
</body>
</html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('Download QR error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/reset-votes', requireAuth, async (req, res) => {
  try {
    await dbRun('DELETE FROM votes');
    await dbRun('UPDATE delegates SET has_voted = 0');
    res.json({ success: true });
  } catch (err) {
    console.error('Reset votes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============= VOTING SYSTEM ROUTES (PUBLIC) =============

// Get all positions with candidates
app.get("/positions", async (req, res) => {
  try {
    // Get positions and candidates separately for better compatibility
    const positions = await dbAll('SELECT * FROM positions ORDER BY display_order');
    
    const result = [];
    for (const position of positions) {
      const candidates = await dbAll(
        'SELECT id, name, image_url, display_order FROM candidates WHERE position_id = ? ORDER BY display_order',
        [position.id]
      );
      
      result.push({
        id: position.id,
        zone: position.zone,
        title: position.title,
        display_order: position.display_order,
        candidates: candidates
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Positions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Verify delegate
app.post("/verify-delegate", async (req, res) => {
  const { token } = req.body;

  try {
    const row = await dbGet(
      `SELECT id, name, has_voted FROM delegates WHERE token = ?`,
      [token]
    );
    
    if (!row) return res.status(400).json({ error: "Invalid token" });

    res.json({
      id: row.id,
      name: row.name,
      has_voted: !!row.has_voted,
    });
  } catch (err) {
    console.error('Verify delegate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Submit all votes
app.post("/submit-votes", async (req, res) => {
  const { token, votes } = req.body;

  if (!Array.isArray(votes) || votes.length === 0) {
    return res.status(400).json({ error: "Invalid votes data" });
  }

  try {
    const delegate = await dbGet(`SELECT * FROM delegates WHERE token = ?`, [token]);
    
    if (!delegate) return res.status(400).json({ error: "Invalid token" });
    if (delegate.has_voted) return res.status(400).json({ error: "ALREADY VOTED" });

    // Insert all votes
    for (const vote of votes) {
      await dbRun(
        `INSERT INTO votes (delegate_id, position_id, candidate_id) VALUES (?, ?, ?)`,
        [delegate.id, vote.position_id, vote.candidate_id]
      );
    }

    // Mark delegate as voted
    await dbRun(
      `UPDATE delegates SET has_voted = ? WHERE id = ?`,
      [1, delegate.id]
    );

    // Emit socket event for live updates
    io.emit("new_votes", {
      delegate_id: delegate.id,
      vote_count: votes.length,
    });

    res.json({ 
      success: true, 
      message: "All votes recorded successfully" 
    });
  } catch (err) {
    console.error('Submit votes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get results
app.get("/results", async (req, res) => {
  try {
    const positions = await dbAll('SELECT * FROM positions ORDER BY display_order');
    
    const results = [];
    for (const position of positions) {
      const candidates = await dbAll(`
        SELECT 
          c.id as candidate_id,
          c.name as candidate_name,
          COUNT(v.id) as vote_count
        FROM candidates c
        LEFT JOIN votes v ON c.id = v.candidate_id
        WHERE c.position_id = ?
        GROUP BY c.id
        ORDER BY c.display_order
      `, [position.id]);
      
      results.push({
        position_id: position.id,
        position_title: position.title,
        zone: position.zone,
        candidates: candidates
      });
    }

    res.json(results);
  } catch (err) {
    console.error('Results error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get statistics
app.get("/statistics", async (req, res) => {
  try {
    const delegatesCount = await dbGet('SELECT COUNT(*) as count FROM delegates');
    const votedCount = await dbGet('SELECT COUNT(*) as count FROM delegates WHERE has_voted = 1');
    const votesCount = await dbGet('SELECT COUNT(*) as count FROM votes');
    
    res.json({
      total_delegates: delegatesCount?.count || 0,
      voted_delegates: votedCount?.count || 0,
      total_votes: votesCount?.count || 0
    });
  } catch (err) {
    console.error('Statistics error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============= SOCKET.IO =============

io.on("connection", (socket) => {
  console.log("Client connected to dashboard");
  
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// ============= START SERVER =============

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n✨ INC Voting System Running`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`🗳️  Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
  console.log(`💾 Database: ${isCloudDatabase ? 'SQLiteCloud' : 'Local SQLite'}\n`);
});