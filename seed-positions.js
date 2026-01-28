// seed-positions.js
// Manually seed positions and candidates

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./inc_votes.db");

console.log("🌱 Seeding positions and candidates...\n");

// Create tables if they don't exist
db.serialize(() => {
  // Positions table
  db.run(`CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zone TEXT,
    title TEXT,
    display_order INTEGER
  )`);

  // Candidates table
  db.run(`CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position_id INTEGER,
    name TEXT,
    image_url TEXT,
    display_order INTEGER,
    FOREIGN KEY (position_id) REFERENCES positions(id)
  )`);

  // Check if positions already exist
  db.get("SELECT COUNT(*) as count FROM positions", [], (err, row) => {
    if (err) {
      console.error("Error checking positions:", err);
      db.close();
      return;
    }

    if (row.count > 0) {
      console.log(`⚠️  ${row.count} positions already exist.`);
      console.log("   Delete them first? Run: sqlite3 inc_votes.db 'DELETE FROM positions;'\n");
      db.close();
      return;
    }

    // Seed positions
    const positions = [
      { zone: "CENTRAL ZONE", title: "President", order: 1 },
      { zone: "CENTRAL ZONE", title: "Vice President 3", order: 2 },
      { zone: "CENTRAL ZONE", title: "National Auditor", order: 3 },
      { zone: "CENTRAL ZONE", title: "National Publicity Secretary", order: 4 },
      { zone: "CENTRAL ZONE", title: "National Assistant Secretary", order: 5 },
      { zone: "EASTERN ZONE", title: "Vice President 2", order: 6 },
      { zone: "EASTERN ZONE", title: "National Secretary", order: 7 },
      { zone: "EASTERN ZONE", title: "National Legal Adviser", order: 8 },
      { zone: "EASTERN ZONE", title: "National Financial Secretary", order: 9 },
      { zone: "EASTERN ZONE", title: "National Welfare Secretary", order: 10 },
      { zone: "WESTERN ZONE", title: "Vice President 1", order: 11 },
      { zone: "WESTERN ZONE", title: "National Organising Secretary", order: 12 },
      { zone: "WESTERN ZONE", title: "National Treasurer", order: 13 },
      { zone: "WESTERN ZONE", title: "National Women Affairs Secretary", order: 14 },
    ];

    const posStmt = db.prepare(
      "INSERT INTO positions (zone, title, display_order) VALUES (?, ?, ?)"
    );

    positions.forEach((pos) => {
      posStmt.run(pos.zone, pos.title, pos.order, (err) => {
        if (err) console.error("Error inserting position:", err);
        else console.log(`✓ Added: [${pos.zone}] ${pos.title}`);
      });
    });

    posStmt.finalize(() => {
      console.log("\n✅ All 14 positions added!\n");

      // Add sample candidates
      console.log("Adding sample candidates...\n");
      
      const candStmt = db.prepare(
        "INSERT INTO candidates (position_id, name, image_url, display_order) VALUES (?, ?, ?, ?)"
      );

      for (let posId = 1; posId <= 14; posId++) {
        candStmt.run(posId, `Candidate 1 for Position ${posId}`, null, 1);
        candStmt.run(posId, `Candidate 2 for Position ${posId}`, null, 2);
      }

      candStmt.finalize(() => {
        console.log("✅ Sample candidates added (2 per position)\n");
        console.log("💡 Update candidate names with: node manage-candidates.js\n");
        db.close();
      });
    });
  });
});