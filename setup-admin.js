// setup-admin.js
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

const db = new sqlite3.Database("./inc_votes.db");

console.log("🔧 Setting up admin panel...\n");

db.serialize(() => {
  // Create admin_users table
  db.run(`CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error("❌ Error creating admin_users table:", err);
      return;
    }
    console.log("✅ admin_users table created");
  });

  // Create default admin user
  const defaultPassword = bcrypt.hashSync('admin123', 10);
  db.run(
    `INSERT OR IGNORE INTO admin_users (id, username, password_hash) 
     VALUES (1, 'admin', ?)`,
    [defaultPassword],
    (err) => {
      if (err) {
        console.error("❌ Error creating admin user:", err);
      } else {
        console.log("✅ Default admin user created");
        console.log("\n📝 Login Credentials:");
        console.log("   Username: admin");
        console.log("   Password: admin123\n");
      }
    }
  );

  // Add missing columns to delegates table (if needed)
  const delegateColumns = [
    { name: 'gender', type: 'TEXT' },
    { name: 'community', type: 'TEXT' },
    { name: 'zone', type: 'TEXT' },
    { name: 'phone', type: 'TEXT' },
    { name: 'email', type: 'TEXT' }
  ];

  delegateColumns.forEach(col => {
    db.run(`ALTER TABLE delegates ADD COLUMN ${col.name} ${col.type}`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.log(`⚠️  Column ${col.name} already exists or error:`, err.message);
      } else if (!err) {
        console.log(`✅ Added column ${col.name} to delegates table`);
      }
    });
  });

  // Add missing columns to candidates table (if needed)
  const candidateColumns = [
    { name: 'gender', type: 'TEXT' },
    { name: 'community', type: 'TEXT' },
    { name: 'zone', type: 'TEXT' }
  ];

  candidateColumns.forEach(col => {
    db.run(`ALTER TABLE candidates ADD COLUMN ${col.name} ${col.type}`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.log(`⚠️  Column ${col.name} already exists or error:`, err.message);
      } else if (!err) {
        console.log(`✅ Added column ${col.name} to candidates table`);
      }
    });
  });
});

db.close(() => {
  console.log("\n✨ Setup complete! You can now start the server:");
  console.log("   node server-admin.js\n");
});