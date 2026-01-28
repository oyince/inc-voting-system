// generate-qr-codes.js
// Generates QR codes for all delegates in the database
// Usage: node generate-qr-codes.js
// Requires: npm install qrcode

const sqlite3 = require("sqlite3").verbose();
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const db = new sqlite3.Database("./inc_votes.db");

// Create directory for QR codes
const qrDir = "./qr-codes";
if (!fs.existsSync(qrDir)) {
  fs.mkdirSync(qrDir);
}

console.log("🎯 Generating QR Codes for INC Delegates...\n");

db.all("SELECT id, name, token FROM delegates", [], async (err, rows) => {
  if (err) {
    console.error("Database error:", err);
    db.close();
    return;
  }

  if (rows.length === 0) {
    console.log("⚠️  No delegates found in database.");
    console.log("💡 Run 'node seed-delegates.js' first to add delegates.\n");
    db.close();
    return;
  }

  console.log(`Found ${rows.length} delegates. Generating QR codes...\n`);

  for (const delegate of rows) {
    try {
      const fileName = `${delegate.id}_${delegate.name.replace(/\s+/g, "_")}.png`;
      const filePath = path.join(qrDir, fileName);

      // Generate QR code with the token
      await QRCode.toFile(filePath, delegate.token, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      console.log(`✓ ${delegate.name} - ${fileName}`);
    } catch (error) {
      console.error(`✗ Error generating QR for ${delegate.name}:`, error.message);
    }
  }

  console.log(`\n✅ QR codes saved to '${qrDir}/' directory`);
  console.log("\n📝 You can now print these QR codes for delegates to scan.\n");

  // Generate an HTML page with all QR codes
  generateHTMLPage(rows);
  
  db.close();
});

function generateHTMLPage(delegates) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>INC Delegate QR Codes</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background-color: #f5f5f5;
    }
    h1 {
      text-align: center;
      color: #1f2937;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .card {
      background: white;
      border: 2px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      page-break-inside: avoid;
    }
    .card img {
      max-width: 100%;
      height: auto;
    }
    .name {
      font-size: 18px;
      font-weight: bold;
      margin: 10px 0;
      color: #1f2937;
    }
    .token {
      font-family: monospace;
      font-size: 14px;
      color: #666;
      background: #f0f0f0;
      padding: 5px;
      border-radius: 4px;
    }
    @media print {
      body { background: white; }
      .grid { gap: 10px; }
    }
  </style>
</head>
<body>
  <h1>Ijaw National Congress - Delegate QR Codes</h1>
  <div class="grid">
    ${delegates.map(d => `
    <div class="card">
      <img src="qr-codes/${d.id}_${d.name.replace(/\s+/g, "_")}.png" alt="${d.name}">
      <div class="name">${d.name}</div>
      <div class="token">${d.token}</div>
    </div>
    `).join('')}
  </div>
</body>
</html>
  `;

  fs.writeFileSync("delegate-qr-codes.html", html);
  console.log("📄 HTML page created: delegate-qr-codes.html");
  console.log("   Open this file in a browser to view/print all QR codes.\n");
}