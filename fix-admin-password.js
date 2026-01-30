#!/usr/bin/env node
// fix-admin-password.js
require("dotenv").config();
const SQLiteCloud = require("@sqlitecloud/drivers");
const bcrypt = require("bcryptjs");

const SQLITECLOUD_URL = process.env.SQLITECLOUD_URL;

async function fixPassword() {
  try {
    const db = new SQLiteCloud.Database(SQLITECLOUD_URL);
    console.log("✅ Connected to SQLiteCloud\n");

    // Hash the password
    const password = "admin123";
    const hash = bcrypt.hashSync(password, 10);
    
    console.log("🔄 Updating admin password hash...");
    console.log(`   Hash: ${hash.substring(0, 30)}...`);

    // Update the password
    const result = await db.sql(
      "UPDATE admin_users SET password_hash = ? WHERE username = 'admin'",
      hash
    );

    console.log("\n✅ Password updated successfully!");
    console.log("\n📝 Test Login:");
    console.log("   Username: admin");
    console.log("   Password: admin123");
    console.log("\n🌐 Go to: http://localhost:10000/admin");
    
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

fixPassword();
