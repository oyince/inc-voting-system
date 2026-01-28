// check-status.js
// Quick status check for the INC Voting System
// Usage: node check-status.js

const sqlite3 = require("sqlite3").verbose();
const http = require("http");

console.log("\n🔍 INC Voting System Status Check\n");
console.log("=" .repeat(50));

// Check database
const db = new sqlite3.Database("./inc_votes.db", (err) => {
  if (err) {
    console.log("\n❌ DATABASE: Not accessible");
    console.log("   Error:", err.message);
    return;
  }
  console.log("\n✅ DATABASE: Connected");

  // Check delegates
  db.get("SELECT COUNT(*) as total FROM delegates", [], (err, row) => {
    if (err) {
      console.log("   ⚠️  Delegates table: Error -", err.message);
    } else {
      console.log(`   📋 Total delegates: ${row.total}`);
      
      // Check how many voted
      db.get("SELECT COUNT(*) as voted FROM delegates WHERE has_voted = 1", [], (err, vRow) => {
        if (!err) {
          const percentage = row.total > 0 ? ((vRow.voted / row.total) * 100).toFixed(1) : 0;
          console.log(`   ✓ Voted: ${vRow.voted} (${percentage}%)`);
          console.log(`   ✓ Eligible: ${row.total - vRow.voted}`);
        }
      });
    }
  });

  // Check votes
  db.all(
    "SELECT candidate, COUNT(*) as total FROM votes GROUP BY candidate",
    [],
    (err, rows) => {
      if (err) {
        console.log("   ⚠️  Votes table: Error -", err.message);
      } else {
        console.log("\n   📊 Vote Distribution:");
        if (rows.length === 0) {
          console.log("      No votes cast yet");
        } else {
          rows.forEach((row) => {
            console.log(`      ${row.candidate}: ${row.total} votes`);
          });
        }
      }
      
      db.close();
    }
  );
});

// Check if server is running
setTimeout(() => {
  console.log("\n🌐 SERVER CHECK:");
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/results',
    method: 'GET',
    timeout: 2000
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log("   ✅ Backend server: Running on port 3000");
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          console.log("   ✅ API responding correctly");
        } catch (e) {
          console.log("   ⚠️  API responding but unexpected format");
        }
      });
    } else {
      console.log(`   ⚠️  Backend server: Unexpected status ${res.statusCode}`);
    }
  });

  req.on('error', (e) => {
    console.log("   ❌ Backend server: Not running");
    console.log("      Start with: node server.js");
  });

  req.on('timeout', () => {
    console.log("   ⚠️  Backend server: Timeout");
    req.destroy();
  });

  req.end();
}, 500);

// System recommendations
setTimeout(() => {
  console.log("\n💡 RECOMMENDATIONS:");
  
  const fs = require('fs');
  
  // Check for QR codes directory
  if (fs.existsSync('./qr-codes')) {
    const files = fs.readdirSync('./qr-codes');
    console.log(`   ✓ QR codes folder exists (${files.length} files)`);
  } else {
    console.log("   ⚠️  No QR codes folder found");
    console.log("      Run: node generate-qr-codes.js");
  }
  
  // Check for HTML page
  if (fs.existsSync('./delegate-qr-codes.html')) {
    console.log("   ✓ QR codes HTML page exists");
  } else {
    console.log("   ⚠️  QR codes HTML page not found");
    console.log("      Run: node generate-qr-codes.js");
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("\n✨ Status check complete!\n");
}, 1000);