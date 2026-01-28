// seed-delegates.js
// Run this script to populate the database with test delegates
// Usage: node seed-delegates.js

const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");

const db = new sqlite3.Database("./inc_votes.db");

// Generate unique token
function generateToken(index) {
  const randomPart = crypto.randomBytes(6).toString("hex").toUpperCase();
  return `INC-1-${randomPart}`;
}

// Sample delegate names
const delegateNames = [
  "Chief Adeola Williams",
  "Dr. Ebiere Tonye",
  "Hon. Taribo George",
  "Mrs. Peremobowei Jack",
  "Chief Owei Lakemfa",
  "Barr. Bomo Clark",
  "Prof. Inikori Amabebe",
  "Engr. Seiyefa Brisibe",
  "Dr. Tonbra Okodi",
  "Chief Ebiere Igali",
  "Hon. Binaebi Dudafa",
  "Mrs. Toruemi Brown",
  "Chief Okorotiemien Azibapu",
  "Dr. Seleipiri Alagoa",
  "Barr. Nengi Manuel",
  "Prof. Ebikabowei Victor",
  "Chief Ibifubara Nelson",
  "Hon. Ebizimo Diriyai",
  "Dr. Preye Thompson",
  "Chief Ibamalaye Joshua"
];

console.log("🌟 Starting INC Delegate Database Seeding...\n");

// Clear existing delegates (optional - comment out if you want to keep existing)
db.run("DELETE FROM delegates", (err) => {
  if (err) {
    console.error("Error clearing delegates:", err);
    return;
  }
  console.log("✓ Cleared existing delegates\n");

  // Insert new delegates
  const stmt = db.prepare("INSERT INTO delegates (name, token, has_voted) VALUES (?, ?, 0)");

  console.log("Adding delegates:\n");
  delegateNames.forEach((name, index) => {
    const token = generateToken(index);
    stmt.run(name, token, (err) => {
      if (err) {
        console.error(`Error adding ${name}:`, err);
      } else {
        console.log(`✓ ${name} - Token: ${token}`);
      }
    });
  });

  stmt.finalize(() => {
    console.log(`\n✅ Successfully added ${delegateNames.length} delegates!`);
    console.log("\n📋 Sample tokens you can use for testing:");
    
    db.all("SELECT name, token FROM delegates LIMIT 5", [], (err, rows) => {
      if (err) {
        console.error(err);
      } else {
        rows.forEach(row => {
          console.log(`   ${row.name}: ${row.token}`);
        });
      }
      
      console.log("\n💡 To view all delegates, run:");
      console.log("   sqlite3 inc_votes.db 'SELECT * FROM delegates;'\n");
      
      db.close();
    });
  });
});