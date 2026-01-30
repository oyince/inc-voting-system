// server-admin-sqlitecloud.js
// Backend server for INC Voting System with SQLiteCloud Database
// Compatible with your existing admin-panel directory structure

require('dotenv').config({ path: '.env' });
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const Database = require('@sqlitecloud/drivers').Database;

const app = express();
const PORT = process.env.PORT || 10000;

// SQLiteCloud Database connection
let db;
const connectDatabase = async () => {
  try {
    db = new Database(process.env.SQLITECLOUD_URL);
    console.log('✅ Connected to SQLiteCloud database');
    return db;
  } catch (err) {
    console.error('❌ SQLiteCloud connection failed:', err);
    process.exit(1);
  }
};

// Helper function to run queries
const dbQuery = async (sql, params = []) => {
  try {
    const result = await db.sql(sql, ...params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'inc-voting-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// ============================================
// SERVE STATIC FILES - YOUR DIRECTORY STRUCTURE
// ============================================

// Serve admin-panel directory (contains css, js, index.html)
app.use('/admin-panel', express.static(path.join(__dirname, 'admin-panel')));

// Serve other directories if they exist
app.use('/documentation', express.static(path.join(__dirname, 'documentation')));
app.use('/inc-voting-ui', express.static(path.join(__dirname, 'inc-voting-ui')));
app.use('/candidates', express.static(path.join(__dirname, 'candidates')));
app.use('/qr-codes', express.static(path.join(__dirname, 'qr-codes')));

// ============================================
// ROUTES TO SERVE HTML PAGES
// ============================================

// Root path - redirect to admin
app.get('/', (req, res) => {
  res.redirect('/admin/');
});

// Serve admin panel at /admin and /admin/
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-panel', 'index.html'));
});

app.get('/admin/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-panel', 'index.html'));
});

// Also allow direct access via /admin-panel path
app.get('/admin-panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-panel', 'index.html'));
});

app.get('/admin-panel/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-panel', 'index.html'));
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './candidates';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session.admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================

app.get('/admin/auth-status', (req, res) => {
  if (req.session.admin) {
    res.json({
      authenticated: true,
      username: req.session.admin.username
    });
  } else {
    res.json({ authenticated: false });
  }
});

app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await dbQuery(
      'SELECT * FROM admin_users WHERE username = ?',
      [username]
    );

    const user = Array.isArray(result) ? result[0] : result;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.admin = {
      id: user.id,
      username: user.username
    };

    res.json({
      success: true,
      username: user.username
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// ============================================
// DASHBOARD STATS
// ============================================
app.get('/admin/stats', requireAuth, async (req, res) => {
  try {
    const stats = await dbQuery(`
      SELECT 
        (SELECT COUNT(*) FROM delegates) as total_delegates,
        (SELECT COUNT(*) FROM delegates WHERE has_voted = 1) as voted_delegates,
        (SELECT COUNT(*) FROM candidates) as total_candidates,
        (SELECT COUNT(*) FROM votes) as total_votes
    `);

    const result = Array.isArray(stats) ? stats[0] : stats;
    res.json(result);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============================================
// DELEGATES ROUTES
// ============================================

app.get('/admin/delegates', requireAuth, async (req, res) => {
  try {
    const delegates = await dbQuery(`
      SELECT * FROM delegates ORDER BY name ASC
    `);

    const delegatesArray = Array.isArray(delegates) ? delegates : [delegates];

    res.json({
      delegates: delegatesArray,
      total: delegatesArray.length
    });
  } catch (error) {
    console.error('Get delegates error:', error);
    res.status(500).json({ error: 'Failed to fetch delegates' });
  }
});

app.get('/admin/delegates/:id', requireAuth, async (req, res) => {
  try {
    const result = await dbQuery(
      'SELECT * FROM delegates WHERE id = ?',
      [req.params.id]
    );

    const delegate = Array.isArray(result) ? result[0] : result;

    if (!delegate) {
      return res.status(404).json({ error: 'Delegate not found' });
    }

    res.json(delegate);
  } catch (error) {
    console.error('Get delegate error:', error);
    res.status(500).json({ error: 'Failed to fetch delegate' });
  }
});

app.post('/admin/delegates', requireAuth, async (req, res) => {
  try {
    const { name, gender, community, zone, phone, email } = req.body;

    if (!name || !zone) {
      return res.status(400).json({ error: 'Name and zone are required' });
    }

    const token = `INC-1-${Date.now().toString(16).toUpperCase().slice(-12)}`;

    await dbQuery(`
      INSERT INTO delegates (name, token, gender, community, zone, phone, email, has_voted)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [name, token, gender || '', community || '', zone, phone || '', email || '']);

    res.json({
      success: true,
      token
    });

  } catch (error) {
    console.error('Add delegate error:', error);
    res.status(500).json({ error: 'Failed to add delegate' });
  }
});

app.put('/admin/delegates/:id', requireAuth, async (req, res) => {
  try {
    const { name, gender, community, zone, phone, email } = req.body;

    await dbQuery(`
      UPDATE delegates 
      SET name = ?, gender = ?, community = ?, zone = ?, phone = ?, email = ?
      WHERE id = ?
    `, [name, gender || '', community || '', zone, phone || '', email || '', req.params.id]);

    res.json({ success: true });

  } catch (error) {
    console.error('Update delegate error:', error);
    res.status(500).json({ error: 'Failed to update delegate' });
  }
});

app.delete('/admin/delegates/:id', requireAuth, async (req, res) => {
  try {
    await dbQuery('DELETE FROM votes WHERE delegate_id = ?', [req.params.id]);
    await dbQuery('DELETE FROM delegates WHERE id = ?', [req.params.id]);

    res.json({ success: true });

  } catch (error) {
    console.error('Delete delegate error:', error);
    res.status(500).json({ error: 'Failed to delete delegate' });
  }
});

app.get('/admin/delegates/:id/qr', requireAuth, async (req, res) => {
  try {
    const result = await dbQuery(
      'SELECT * FROM delegates WHERE id = ?',
      [req.params.id]
    );

    const delegate = Array.isArray(result) ? result[0] : result;

    if (!delegate) {
      return res.status(404).json({ error: 'Delegate not found' });
    }

    const qrDir = './qr-codes';
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    const qrPath = path.join(qrDir, `${delegate.token}.png`);
    
    if (!fs.existsSync(qrPath)) {
      const votingUrl = `${process.env.FRONTEND_URL}/vote?token=${delegate.token}`;
      await QRCode.toFile(qrPath, votingUrl, {
        width: 400,
        margin: 2
      });
    }

    res.json({
      name: delegate.name,
      token: delegate.token,
      qr_code: `/qr-codes/${delegate.token}.png`
    });

  } catch (error) {
    console.error('QR code error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

app.post('/admin/delegates/import', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csv = require('csv-parser');
    const results = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let imported = 0;

        for (const row of results) {
          try {
            const token = `INC-1-${Date.now().toString(16).toUpperCase().slice(-12)}`;
            
            await dbQuery(`
              INSERT INTO delegates (name, token, gender, community, zone, phone, email, has_voted)
              VALUES (?, ?, ?, ?, ?, ?, ?, 0)
            `, [
              row.name || '',
              token,
              row.gender || '',
              row.community || '',
              row.zone || '',
              row.phone || '',
              row.email || ''
            ]);

            imported++;
            await new Promise(resolve => setTimeout(resolve, 10));
          } catch (err) {
            console.error('Row import error:', err);
          }
        }

        fs.unlinkSync(req.file.path);

        res.json({
          success: true,
          count: imported
        });
      });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import delegates' });
  }
});

// ============================================
// CANDIDATES ROUTES
// ============================================

app.get('/admin/candidates', requireAuth, async (req, res) => {
  try {
    const candidates = await dbQuery(`
      SELECT 
        c.*,
        p.title as position_title,
        p.zone
      FROM candidates c
      LEFT JOIN positions p ON c.position_id = p.id
      ORDER BY p.display_order, c.display_order
    `);

    const candidatesArray = Array.isArray(candidates) ? candidates : [candidates];

    res.json({
      candidates: candidatesArray,
      total: candidatesArray.length
    });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

app.get('/admin/candidates/:id', requireAuth, async (req, res) => {
  try {
    const result = await dbQuery(
      'SELECT * FROM candidates WHERE id = ?',
      [req.params.id]
    );

    const candidate = Array.isArray(result) ? result[0] : result;

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json(candidate);
  } catch (error) {
    console.error('Get candidate error:', error);
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

app.post('/admin/candidates', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, position_id, gender, community, zone } = req.body;

    if (!name || !position_id) {
      return res.status(400).json({ error: 'Name and position are required' });
    }

    const maxOrderResult = await dbQuery(
      'SELECT MAX(display_order) as max_order FROM candidates WHERE position_id = ?',
      [position_id]
    );
    const maxOrder = Array.isArray(maxOrderResult) ? maxOrderResult[0] : maxOrderResult;
    const displayOrder = (maxOrder.max_order || 0) + 1;

    const imageUrl = req.file ? `/candidates/${req.file.filename}` : null;

    await dbQuery(`
      INSERT INTO candidates (name, position_id, gender, community, zone, image_url, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, position_id, gender || '', community || '', zone || '', imageUrl, displayOrder]);

    res.json({ success: true });

  } catch (error) {
    console.error('Add candidate error:', error);
    res.status(500).json({ error: 'Failed to add candidate' });
  }
});

app.put('/admin/candidates/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { position_id, gender, community, zone } = req.body;

    let query = `
      UPDATE candidates 
      SET position_id = ?, gender = ?, community = ?, zone = ?
    `;
    let params = [position_id, gender || '', community || '', zone || ''];

    if (req.file) {
      query += `, image_url = ?`;
      params.push(`/candidates/${req.file.filename}`);
    }

    query += ` WHERE id = ?`;
    params.push(req.params.id);

    await dbQuery(query, params);

    res.json({ success: true });

  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

app.delete('/admin/candidates/:id', requireAuth, async (req, res) => {
  try {
    await dbQuery('DELETE FROM votes WHERE candidate_id = ?', [req.params.id]);
    await dbQuery('DELETE FROM candidates WHERE id = ?', [req.params.id]);

    res.json({ success: true });

  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

// ============================================
// POSITIONS ROUTES
// ============================================

app.get('/admin/positions', requireAuth, async (req, res) => {
  try {
    const positions = await dbQuery(`
      SELECT * FROM positions ORDER BY display_order ASC
    `);

    const positionsArray = Array.isArray(positions) ? positions : [positions];
    res.json(positionsArray);
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// ============================================
// QR CODES
// ============================================

app.post('/admin/qr-codes/generate', requireAuth, async (req, res) => {
  try {
    const delegates = await dbQuery('SELECT * FROM delegates');
    const delegatesArray = Array.isArray(delegates) ? delegates : [delegates];
    
    const qrDir = './qr-codes';
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    let generated = 0;

    for (const delegate of delegatesArray) {
      const qrPath = path.join(qrDir, `${delegate.token}.png`);
      
      if (!fs.existsSync(qrPath)) {
        const votingUrl = `${process.env.FRONTEND_URL}/vote?token=${delegate.token}`;
        await QRCode.toFile(qrPath, votingUrl, {
          width: 400,
          margin: 2
        });
        generated++;
      }
    }

    res.json({
      success: true,
      count: generated,
      total: delegatesArray.length
    });

  } catch (error) {
    console.error('Generate QR codes error:', error);
    res.status(500).json({ error: 'Failed to generate QR codes' });
  }
});

// ============================================
// VOTING RESULTS
// ============================================

app.get('/results', async (req, res) => {
  try {
    const positions = await dbQuery(`
      SELECT * FROM positions ORDER BY display_order ASC
    `);

    const positionsArray = Array.isArray(positions) ? positions : [positions];
    const results = [];

    for (const position of positionsArray) {
      const candidates = await dbQuery(`
        SELECT 
          c.id,
          c.name as candidate_name,
          c.image_url,
          COUNT(v.id) as vote_count
        FROM candidates c
        LEFT JOIN votes v ON c.id = v.candidate_id
        WHERE c.position_id = ?
        GROUP BY c.id
        ORDER BY vote_count DESC, c.display_order ASC
      `, [position.id]);

      const candidatesArray = Array.isArray(candidates) ? candidates : [candidates];

      results.push({
        position_id: position.id,
        position_title: position.title,
        zone: position.zone,
        candidates: candidatesArray
      });
    }

    res.json(results);

  } catch (error) {
    console.error('Results error:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// ============================================
// RESET VOTES
// ============================================

app.post('/admin/reset-votes', requireAuth, async (req, res) => {
  try {
    await dbQuery('DELETE FROM votes');
    await dbQuery('UPDATE delegates SET has_voted = 0');

    res.json({ success: true });

  } catch (error) {
    console.error('Reset votes error:', error);
    res.status(500).json({ error: 'Failed to reset votes' });
  }
});

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║  🗳️  INC Voting System - Server Running              ║
╠═══════════════════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(44)} ║
║  Database: SQLiteCloud                               ║
╠═══════════════════════════════════════════════════════╣
║  Admin Login: admin / admin123                       ║
╠═══════════════════════════════════════════════════════╣
║  URLs:                                               ║
║    /admin/        → Admin panel                      ║
║    /admin-panel/  → Admin panel (alt)                ║
║    /health        → Health check                     ║
╚═══════════════════════════════════════════════════════╝
    `);
  });
};

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});