// reset-votes.js
// Resets all votes and marks all delegates as not voted
// Usage: node reset-votes.js
// WARNING: This will delete ALL voting data!

const sqlite3 = require("sqlite3").verbose();
const readline = require("readline");

const db = new sqlite3.Database("./inc_votes.db");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("\n⚠️  WARNING: VOTE RESET UTILITY ⚠️\n");
console.log("This will:");
console.log("  1. Delete ALL votes from the database");
console.log("  2. Mark ALL delegates as 'not voted'");
console.log("  3. Reset the dashboard to zero\n");

rl.question("Are you sure you want to continue? (type 'YES' to confirm): ", (answer) => {
  if (answer.toUpperCase() === "YES") {
    console.log("\n🔄 Resetting voting system...\n");

    // Delete all votes
    db.run("DELETE FROM votes", (err) => {
      if (err) {
        console.error("❌ Error deleting votes:", err);
        db.close();
        rl.close();
        return;
      }
      console.log("✓ All votes deleted");

      // Reset all delegates to not voted
      db.run("UPDATE delegates SET has_voted = 0", (err) => {
        if (err) {
          console.error("❌ Error resetting delegates:", err);
          db.close();
          rl.close();
          return;
        }
        console.log("✓ All delegates marked as 'not voted'");

        // Show summary
        db.get("SELECT COUNT(*) as total FROM delegates", [], (err, row) => {
          if (err) {
            console.error("Error getting delegate count:", err);
          } else {
            console.log(`\n✅ Reset complete!`);
            console.log(`   ${row.total} delegates are now eligible to vote.\n`);
          }
          db.close();
          rl.close();
        });
      });
    });
  } else {
    console.log("\n❌ Reset cancelled.\n");
    db.close();
    rl.close();
  }
});