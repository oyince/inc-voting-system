// server-admin.js
// Backend server for INC Voting System with SQLiteCloud Database
// Root directory: INC-VOTING-SYSTEM/server-admin.js

require('dotenv').config({ path: '.env' });
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { Database } = require('@sqlitecloud/drivers');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || true,
    credentials: true
  }
});

const PORT = process.env.PORT || 10000;

// SQLiteCloud Database connection
let db;
const connectDatabase = async () => {
  try {
    const connectionString = process.env.SQLITECLOUD_URL;
    console.log('🔄 Connecting to SQLiteCloud...');
    console.log('Connection string:', connectionString.replace(/apikey=[^&]+/, 'apikey=***'));
    
    db = new Database(connectionString);
    
    // Test the connection
    const testResult = await db.sql('SELECT 1 as test');
    console.log('✅ Connected to SQLiteCloud database successfully');
    console.log('Test query result:', testResult);
    
    return db;
  } catch (err) {
    console.error('❌ SQLiteCloud connection failed:', err);
    console.error('Error details:', err.message);
    process.exit(1);
  }
};

// Helper function to run queries with proper error handling
const dbQuery = async (sql, params = []) => {
  try {
    console.log('Executing query:', sql);
    console.log('With params:', params);
    
    const result = await db.sql(sql, ...params);
    
    console.log('Query result:', result);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
};

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
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

// Serve the built React voting UI
app.use(express.static(path.join(__dirname, 'inc-voting-ui', 'build')));

// Serve other directories if they exist
app.use('/documentation', express.static(path.join(__dirname, 'documentation')));
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
app.get('/health', async (req, res) => {
  try {
    const testResult = await db.sql('SELECT 1 as test');
    res.json({ 
      status: 'ok', 
      message: 'Server is running',
      database: 'connected',
      test: testResult
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Server running but database error',
      error: error.message
    });
  }
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================

app.get('/admin/auth-status', (req, res) => {
  console.log('Auth status check, session:', req.session);
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
    console.log('Login attempt for user:', username);

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await dbQuery(
      'SELECT * FROM admin_users WHERE username = ?',
      [username]
    );

    console.log('User lookup result:', result);

    // Handle different result formats from SQLiteCloud
    let user = null;
    if (Array.isArray(result) && result.length > 0) {
      user = result[0];
    } else if (result && typeof result === 'object' && result.id) {
      user = result;
    }

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User found:', { id: user.id, username: user.username });

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    console.log('Password match:', passwordMatch);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.admin = {
      id: user.id,
      username: user.username
    };

    console.log('Login successful, session set');

    res.json({
      success: true,
      username: user.username
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
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
    console.log('Fetching dashboard stats...');
    
    // Fetch stats separately to handle SQLiteCloud response format
    const delegatesCount = await dbQuery('SELECT COUNT(*) as count FROM delegates');
    const votedCount = await dbQuery('SELECT COUNT(*) as count FROM delegates WHERE has_voted = 1');
    const candidatesCount = await dbQuery('SELECT COUNT(*) as count FROM candidates');
    const votesCount = await dbQuery('SELECT COUNT(*) as count FROM votes');
    
    console.log('Stats results:', { delegatesCount, votedCount, candidatesCount, votesCount });
    
    const stats = {
      total_delegates: (Array.isArray(delegatesCount) ? delegatesCount[0] : delegatesCount).count || 0,
      voted_delegates: (Array.isArray(votedCount) ? votedCount[0] : votedCount).count || 0,
      total_candidates: (Array.isArray(candidatesCount) ? candidatesCount[0] : candidatesCount).count || 0,
      total_votes: (Array.isArray(votesCount) ? votesCount[0] : votesCount).count || 0
    };
    
    console.log('Formatted stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats: ' + error.message });
  }
});

// ============================================
// DELEGATES ROUTES
// ============================================

app.get('/admin/delegates', requireAuth, async (req, res) => {
  try {
    console.log('Fetching delegates...');
    
    const delegates = await dbQuery('SELECT * FROM delegates ORDER BY name ASC');
    
    console.log('Delegates query result:', delegates);
    
    // Handle different response formats
    let delegatesArray = [];
    if (Array.isArray(delegates)) {
      delegatesArray = delegates;
    } else if (delegates && typeof delegates === 'object') {
      delegatesArray = [delegates];
    }
    
    console.log('Formatted delegates array:', delegatesArray);

    res.json({
      delegates: delegatesArray,
      total: delegatesArray.length
    });
  } catch (error) {
    console.error('Get delegates error:', error);
    res.status(500).json({ error: 'Failed to fetch delegates: ' + error.message });
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
    res.status(500).json({ error: 'Failed to fetch delegate: ' + error.message });
  }
});

app.post('/admin/delegates', requireAuth, async (req, res) => {
  try {
    const { name, gender, community, zone, phone, email } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate unique token
    const token = `INC-1-${Date.now().toString(16).toUpperCase().slice(-12)}`;

    await dbQuery(`
      INSERT INTO delegates (name, token, gender, community, zone, phone, email, has_voted)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [name, token, gender || '', community || '', zone || '', phone || '', email || '']);

    res.json({ success: true, token });

  } catch (error) {
    console.error('Add delegate error:', error);
    res.status(500).json({ error: 'Failed to add delegate: ' + error.message });
  }
});

app.put('/admin/delegates/:id', requireAuth, async (req, res) => {
  try {
    const { name, gender, community, zone, phone, email } = req.body;

    await dbQuery(`
      UPDATE delegates 
      SET name = ?, gender = ?, community = ?, zone = ?, phone = ?, email = ?
      WHERE id = ?
    `, [name, gender || '', community || '', zone || '', phone || '', email || '', req.params.id]);

    res.json({ success: true });

  } catch (error) {
    console.error('Update delegate error:', error);
    res.status(500).json({ error: 'Failed to update delegate: ' + error.message });
  }
});

app.delete('/admin/delegates/:id', requireAuth, async (req, res) => {
  try {
    // Delete associated votes first
    await dbQuery('DELETE FROM votes WHERE delegate_id = ?', [req.params.id]);
    await dbQuery('DELETE FROM delegates WHERE id = ?', [req.params.id]);

    res.json({ success: true });

  } catch (error) {
    console.error('Delete delegate error:', error);
    res.status(500).json({ error: 'Failed to delete delegate: ' + error.message });
  }
});

// Import delegates from CSV
app.post('/admin/delegates/import', requireAuth, async (req, res) => {
  try {
    const { delegates } = req.body;
    
    if (!Array.isArray(delegates) || delegates.length === 0) {
      return res.status(400).json({ error: 'No delegates data provided' });
    }

    let imported = 0;
    let skipped = 0;

    for (const delegate of delegates) {
      try {
        const token = `INC-1-${Date.now().toString(16).toUpperCase().slice(-12)}`;
        
        await dbQuery(`
          INSERT INTO delegates (name, token, gender, community, zone, phone, email, has_voted)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        `, [
          delegate.name,
          token,
          delegate.gender || '',
          delegate.community || '',
          delegate.zone || '',
          delegate.phone || '',
          delegate.email || ''
        ]);
        
        imported++;
        
        // Small delay to ensure unique tokens
        await new Promise(resolve => setTimeout(resolve, 5));
      } catch (err) {
        console.error('Error importing delegate:', delegate.name, err);
        skipped++;
      }
    }

    res.json({
      success: true,
      imported,
      skipped,
      total: delegates.length
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import delegates: ' + error.message });
  }
});

// ============================================
// CANDIDATES ROUTES
// ============================================

app.get('/admin/candidates', requireAuth, async (req, res) => {
  try {
    console.log('Fetching candidates...');
    
    const candidates = await dbQuery(`
      SELECT 
        c.*,
        p.title as position_title,
        p.zone as position_zone
      FROM candidates c
      LEFT JOIN positions p ON c.position_id = p.id
      ORDER BY p.display_order, c.display_order
    `);
    
    console.log('Candidates query result:', candidates);

    let candidatesArray = [];
    if (Array.isArray(candidates)) {
      candidatesArray = candidates;
    } else if (candidates && typeof candidates === 'object') {
      candidatesArray = [candidates];
    }
    
    console.log('Formatted candidates array:', candidatesArray);

    res.json({
      candidates: candidatesArray,
      total: candidatesArray.length
    });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ error: 'Failed to fetch candidates: ' + error.message });
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
    res.status(500).json({ error: 'Failed to fetch candidate: ' + error.message });
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
    res.status(500).json({ error: 'Failed to add candidate: ' + error.message });
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
    res.status(500).json({ error: 'Failed to update candidate: ' + error.message });
  }
});

app.delete('/admin/candidates/:id', requireAuth, async (req, res) => {
  try {
    await dbQuery('DELETE FROM votes WHERE candidate_id = ?', [req.params.id]);
    await dbQuery('DELETE FROM candidates WHERE id = ?', [req.params.id]);

    res.json({ success: true });

  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ error: 'Failed to delete candidate: ' + error.message });
  }
});

// ============================================
// POSITIONS ROUTES
// ============================================

app.get('/admin/positions', requireAuth, async (req, res) => {
  try {
    console.log('Fetching positions...');
    
    const positions = await dbQuery('SELECT * FROM positions ORDER BY display_order ASC');
    
    console.log('Positions query result:', positions);

    let positionsArray = [];
    if (Array.isArray(positions)) {
      positionsArray = positions;
    } else if (positions && typeof positions === 'object') {
      positionsArray = [positions];
    }
    
    console.log('Formatted positions array:', positionsArray);
    
    res.json(positionsArray);
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({ error: 'Failed to fetch positions: ' + error.message });
  }
});

// ============================================
// QR CODES
// ============================================

app.post('/admin/qr-codes/generate', requireAuth, async (req, res) => {
  try {
    const delegates = await dbQuery('SELECT * FROM delegates');
    let delegatesArray = Array.isArray(delegates) ? delegates : [delegates];
    
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
    res.status(500).json({ error: 'Failed to generate QR codes: ' + error.message });
  }
});

// ============================================
// VOTING RESULTS
// ============================================

app.get('/results', async (req, res) => {
  try {
    console.log('Fetching results...');
    
    const positions = await dbQuery('SELECT * FROM positions ORDER BY display_order ASC');
    
    let positionsArray = Array.isArray(positions) ? positions : [positions];
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
        GROUP BY c.id, c.name, c.image_url
        ORDER BY vote_count DESC, c.display_order ASC
      `, [position.id]);

      let candidatesArray = Array.isArray(candidates) ? candidates : [candidates];

      results.push({
        position_id: position.id,
        position_title: position.title,
        zone: position.zone,
        candidates: candidatesArray
      });
    }
    
    console.log('Results formatted:', results);

    res.json(results);

  } catch (error) {
    console.error('Results error:', error);
    res.status(500).json({ error: 'Failed to fetch results: ' + error.message });
  }
});

// ============================================
// STATISTICS (for voting UI dashboard)
// ============================================

app.get('/statistics', async (req, res) => {
  try {
    console.log('Fetching statistics for voting UI...');
    
    const delegatesCount = await dbQuery('SELECT COUNT(*) as count FROM delegates');
    const votedCount = await dbQuery('SELECT COUNT(*) as count FROM delegates WHERE has_voted = 1');
    const votesCount = await dbQuery('SELECT COUNT(*) as count FROM votes');
    const candidatesCount = await dbQuery('SELECT COUNT(*) as count FROM candidates');    
   
    const stats = {
      total_delegates: (Array.isArray(delegatesCount) ? delegatesCount[0] : delegatesCount).count || 0,
      voted_delegates: (Array.isArray(votedCount) ? votedCount[0] : votedCount).count || 0,
      total_votes: (Array.isArray(votesCount) ? votesCount[0] : votesCount).count || 0,
      total_candidates: (Array.isArray(candidatesCount) ? candidatesCount[0] : candidatesCount).count || 0
    };
    
    console.log('Statistics:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics: ' + error.message });
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
    res.status(500).json({ error: 'Failed to reset votes: ' + error.message });
  }
});

// ============================================
// REACT APP CATCH-ALL (must be last)
// ============================================
app.get('*', (req, res) => {
  // Only serve the React index.html if it is NOT an API route
  const apiPaths = ['/admin', '/results', '/statistics', '/health'];
  const isApi = apiPaths.some(path => req.path.startsWith(path));

  if (isApi) {
    // If it's an API path but reached here, it means the specific 
    // route handler above didn't catch it (e.g., wrong method or typo)
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // Serve React app for everything else
  res.sendFile(path.join(__dirname, 'inc-voting-ui', 'build', 'index.html'));
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  await connectDatabase();

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║  🗳️  INC Voting System - Server Running              ║
╠═══════════════════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(44)} ║
║  Database: SQLiteCloud                               ║
║  Environment: ${process.env.NODE_ENV || 'development'}                           ║
║  Socket.IO: Enabled                                  ║
╠═══════════════════════════════════════════════════════╣
║  Admin Login: admin / admin123                       ║
╠═══════════════════════════════════════════════════════╣
║  URLs:                                               ║
║    /admin/        → Admin panel                      ║
║    /admin-panel/  → Admin panel (alt)                ║
║    /health        → Health check                     ║
║    /results       → Live results                     ║
║    /statistics    → Statistics API                   ║
╚═══════════════════════════════════════════════════════╝
    `);
  });
};

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Received SIGTERM, shutting down...');
  process.exit(0);
});

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});