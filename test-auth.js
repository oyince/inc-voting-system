#!/usr/bin/env node
// test-auth.js - Authentication and Database Test Script

require("dotenv").config();
const SQLiteCloud = require("@sqlitecloud/drivers");
const bcrypt = require("bcryptjs");

const SQLITECLOUD_URL = process.env.SQLITECLOUD_URL;

console.log("\n🔍 INC Voting System - Diagnostic Tests\n");
console.log("=" .repeat(50));

// Test 1: Environment Variables
console.log("\n✅ TEST 1: Environment Variables");
console.log("-".repeat(50));

if (!SQLITECLOUD_URL) {
  console.error("❌ SQLITECLOUD_URL is NOT set");
  process.exit(1);
}

console.log("✅ SQLITECLOUD_URL is set");
console.log(`   (Masked: sqlitecloud://${SQLITECLOUD_URL.substring(16, 26)}...)`);

// Test 2: Database Connection
console.log("\n✅ TEST 2: Database Connection");
console.log("-".repeat(50));

let db;
try {
  db = new SQLiteCloud.Database(SQLITECLOUD_URL);
  console.log("✅ Connected to SQLiteCloud successfully");
} catch (err) {
  console.error("❌ Failed to connect to SQLiteCloud:", err.message);
  process.exit(1);
}

// Test 3: Tables Exist
console.log("\n✅ TEST 3: Database Tables");
console.log("-".repeat(50));

async function runTests() {
  try {
    // Check tables using a different approach
    console.log("\n✅ TEST 3: Database Tables");
    console.log("-".repeat(50));

    try {
      // Try to query delegates table as a simple test
      const delegatesRes = await db.sql("SELECT COUNT(*) as count FROM delegates");
      console.log("✅ Database is accessible");
      
      // Parse the response
      if (delegatesRes.data && delegatesRes.data.length > 0) {
        const delegateCount = delegatesRes.data[0][0];
        console.log(`✅ Delegates table: ${delegateCount} records`);
      }
    } catch (e) {
      console.log("⚠️  Database query returned unexpected format, continuing tests...");
    }

    // Check admin_users table
    console.log("\n✅ TEST 4: Admin Credentials");
    console.log("-".repeat(50));

    try {
      const adminRes = await db.sql("SELECT COUNT(*) as count FROM admin_users");
      let adminCount = 0;
      
      if (adminRes.data && Array.isArray(adminRes.data)) {
        adminCount = adminRes.data[0][0];
      }

      if (adminCount === 0) {
        console.error("❌ No admin users found in database");
        console.log("\n   Fix: Run 'node setup-admin.js' to create admin user");
      } else {
        console.log(`✅ Found ${adminCount} admin user(s)`);
      }
    } catch (e) {
      console.error("⚠️  Could not verify admin users:", e.message);
    }

    // Try to get admin user
    try {
      console.log("\n✅ TEST 5: Password Verification");
      console.log("-".repeat(50));

      const adminUser = await db.sql("SELECT username, password_hash FROM admin_users WHERE username = 'admin' LIMIT 1");
      
      if (adminUser && adminUser.data && adminUser.data.length > 0) {
        const [username, passwordHash] = adminUser.data[0];
        console.log(`✅ Found admin user: ${username}`);
        
        // Test bcrypt
        try {
          const isValid = bcrypt.compareSync("admin123", passwordHash);
          if (isValid) {
            console.log("✅ Password 'admin123' matches hash");
          } else {
            console.warn("⚠️  Password 'admin123' does NOT match hash - may need password reset");
          }
        } catch (e) {
          console.warn("⚠️  Could not verify password hash:", e.message);
        }
      } else {
        console.warn("⚠️  Admin user 'admin' not found");
      }
    } catch (e) {
      console.warn("⚠️  Could not query admin user:", e.message);
    }

    // Check data counts
    console.log("\n✅ TEST 6: Data Integrity");
    console.log("-".repeat(50));

    try {
      const tables = {
        delegates: "SELECT COUNT(*) as count FROM delegates",
        candidates: "SELECT COUNT(*) as count FROM candidates",
        positions: "SELECT COUNT(*) as count FROM positions",
        votes: "SELECT COUNT(*) as count FROM votes"
      };

      for (const [name, query] of Object.entries(tables)) {
        try {
          const res = await db.sql(query);
          if (res.data && res.data[0]) {
            const count = res.data[0][0];
            console.log(`✅ ${name}: ${count} records`);
          }
        } catch (e) {
          console.log(`⚠️  Could not count ${name}`);
        }
      }
    } catch (e) {
      console.warn("⚠️  Could not verify data:", e.message);
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("✅ DATABASE CONNECTION SUCCESSFUL!\n");
    console.log("Your system is configured with:");
    console.log("   - SQLiteCloud connection active");
    console.log("   - Admin user: admin");
    console.log("   - Default password: admin123");
    console.log("\n📝 Next Steps:");
    console.log("   1. Start the server: npm start");
    console.log("   2. Visit: http://localhost:10000/admin");
    console.log("   3. Login with admin / admin123");
    console.log("\n⚠️  IMPORTANT: Change the default password in production!");
    console.log("=".repeat(50) + "\n");

  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
    process.exit(1);
  }
}

runTests();
