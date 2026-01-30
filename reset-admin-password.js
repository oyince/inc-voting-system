#!/usr/bin/env node
// reset-admin-password.js
require("dotenv").config();
const SQLiteCloud = require("@sqlitecloud/drivers");
const bcrypt = require("bcryptjs");

const SQLITECLOUD_URL = process.env.SQLITECLOUD_URL;

if (!SQLITECLOUD_URL) {
  console.error("❌ SQLITECLOUD_URL is not set");
  process.exit(1);
}

async function resetPassword() {
  try {
    const db = new SQLiteCloud.Database(SQLITECLOUD_URL);
    console.log("✅ Connected to SQLiteCloud");

    const newPassword = "admin123";
    const passwordHash = bcrypt.hashSync(newPassword, 10);

    console.log("🔄 Resetting admin password...");
    
    const result = await db.sql(
      "UPDATE admin_users SET password_hash = ? WHERE username = 'admin'",
      passwordHash
    );

    console.log("✅ Admin password reset successfully!");
    console.log("\n📝 Login Credentials:");
    console.log("   Username: admin");
    console.log("   Password: admin123");
    console.log("\nTry logging in now at: http://localhost:10000/admin");
    
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

resetPassword();
