// view-votes.js
// View detailed voting information

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./inc_votes.db");

console.log("\n" + "=".repeat(70));
console.log("📊 INC VOTING SYSTEM - DETAILED RESULTS");
console.log("=".repeat(70) + "\n");

// Get overall statistics
db.get(`
  SELECT 
    (SELECT COUNT(*) FROM delegates) as total_delegates,
    (SELECT COUNT(*) FROM delegates WHERE has_voted = 1) as voted_delegates,
    (SELECT COUNT(*) FROM votes) as total_votes,
    (SELECT COUNT(DISTINCT delegate_id) FROM votes) as unique_voters
`, [], (err, stats) => {
  if (err) {
    console.error("Error getting statistics:", err);
    return;
  }

  console.log("📈 OVERALL STATISTICS");
  console.log("-".repeat(70));
  console.log(`Total Delegates:        ${stats.total_delegates}`);
  console.log(`Delegates Who Voted:    ${stats.voted_delegates}`);
  console.log(`Total Votes Cast:       ${stats.total_votes}`);
  console.log(`Turnout:                ${((stats.voted_delegates / stats.total_delegates) * 100).toFixed(1)}%`);
  console.log("");

  // Get results by position
  console.log("🗳️  RESULTS BY POSITION");
  console.log("=".repeat(70) + "\n");

  db.all(`
    SELECT 
      p.id as position_id,
      p.zone,
      p.title as position_title,
      c.id as candidate_id,
      c.name as candidate_name,
      COUNT(v.id) as vote_count
    FROM positions p
    LEFT JOIN candidates c ON p.id = c.position_id
    LEFT JOIN votes v ON c.id = v.candidate_id
    GROUP BY p.id, c.id
    ORDER BY p.display_order, c.display_order
  `, [], (err, results) => {
    if (err) {
      console.error("Error getting results:", err);
      db.close();
      return;
    }

    let currentPosition = null;
    let positionTotal = 0;

    results.forEach((row, idx) => {
      if (currentPosition !== row.position_id) {
        if (currentPosition !== null) {
          console.log(`   Total votes for this position: ${positionTotal}\n`);
        }
        currentPosition = row.position_id;
        positionTotal = 0;
        console.log(`[${row.zone}]`);
        console.log(`${row.position_title}`);
        console.log("-".repeat(70));
      }

      if (row.candidate_id) {
        const percentage = positionTotal > 0 ? ((row.vote_count / positionTotal) * 100).toFixed(1) : 0;
        console.log(`   ${row.candidate_name}: ${row.vote_count} votes`);
        positionTotal += row.vote_count;
      }
    });

    if (positionTotal > 0) {
      console.log(`   Total votes for this position: ${positionTotal}\n`);
    }

    // Show detailed voting records
    showDetailedVotes();
  });
});

function showDetailedVotes() {
  console.log("\n" + "=".repeat(70));
  console.log("📋 DETAILED VOTING RECORDS (Who Voted What)");
  console.log("=".repeat(70) + "\n");

  db.all(`
    SELECT 
      d.name as delegate_name,
      d.token,
      p.zone,
      p.title as position_title,
      c.name as candidate_name,
      v.created_at
    FROM votes v
    JOIN delegates d ON v.delegate_id = d.id
    JOIN positions p ON v.position_id = p.id
    JOIN candidates c ON v.candidate_id = c.id
    ORDER BY d.name, p.display_order
  `, [], (err, records) => {
    if (err) {
      console.error("Error getting detailed records:", err);
      db.close();
      return;
    }

    if (records.length === 0) {
      console.log("No votes recorded yet.\n");
      db.close();
      return;
    }

    let currentDelegate = null;
    let voteCount = 0;

    records.forEach((record) => {
      if (currentDelegate !== record.delegate_name) {
        if (currentDelegate !== null) {
          console.log(`   → Total: ${voteCount} positions voted\n`);
        }
        currentDelegate = record.delegate_name;
        voteCount = 0;
        console.log(`👤 ${record.delegate_name} (${record.token})`);
        console.log("-".repeat(70));
      }

      console.log(`   [${record.zone}] ${record.position_title}`);
      console.log(`      ✓ Voted for: ${record.candidate_name}`);
      console.log(`      ⏰ ${record.created_at}`);
      voteCount++;
    });

    if (voteCount > 0) {
      console.log(`   → Total: ${voteCount} positions voted\n`);
    }

    // Show delegates who haven't voted
    showNonVoters();
  });
}

function showNonVoters() {
  console.log("\n" + "=".repeat(70));
  console.log("⏳ DELEGATES WHO HAVEN'T VOTED YET");
  console.log("=".repeat(70) + "\n");

  db.all(`
    SELECT name, token
    FROM delegates
    WHERE has_voted = 0
    ORDER BY name
  `, [], (err, nonVoters) => {
    if (err) {
      console.error("Error getting non-voters:", err);
      db.close();
      return;
    }

    if (nonVoters.length === 0) {
      console.log("🎉 All delegates have voted!\n");
    } else {
      nonVoters.forEach((delegate) => {
        console.log(`   ❌ ${delegate.name} (${delegate.token})`);
      });
      console.log(`\n   Total not voted: ${nonVoters.length}\n`);
    }

    db.close();
    console.log("=".repeat(70) + "\n");
  });
}