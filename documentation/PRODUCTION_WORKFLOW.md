# INC Voting System - Production Workflow

The complete step-by-step process for setting up your election system.

---

## 📋 **The Workflow**

```
1. Setup Empty Database
   ↓
2. Prepare Excel/CSV Files
   ↓
3. Import Delegates List
   ↓
4. Import Candidates List
   ↓
5. Generate QR Codes & Tokens (Automatic)
   ↓
6. Print QR Codes
   ↓
7. Start Voting System
   ↓
8. Conduct Election
```

---

## 🎯 **STEP-BY-STEP GUIDE**

---

## **STEP 1: Setup Empty Database**

### Option A: PostgreSQL (Production)

```bash
# Install PostgreSQL (if not already installed)
# Mac: brew install postgresql
# Windows: Download from postgresql.org
# Linux: sudo apt install postgresql

# Create empty database
createdb inc_voting

# Or using psql:
psql -U postgres
CREATE DATABASE inc_voting;
\q

# Configure environment
cat > .env << EOF
DB_USER=postgres
DB_HOST=localhost
DB_NAME=inc_voting
DB_PASSWORD=your_password
DB_PORT=5432
PORT=3000
FRONTEND_URL=http://localhost:3001
EOF

# Start server (creates empty tables automatically)
node server-postgres.js
```

**✅ Output you should see:**
```
✅ Connected to PostgreSQL database
✅ Database tables initialized
✅ Positions initialized

🚀 Server running on http://localhost:3000
📊 Positions: 14
```

### Option B: SQLite (Development/Testing)

```bash
# Even simpler - just start the server
node server.js

# Database file (inc_votes.db) is created automatically
# Tables are created automatically
```

---

## **STEP 2: Prepare Your Excel/CSV Files**

### A. Delegates File

**Create:** `delegates.xlsx` or `delegates.csv`

**Required columns:**
```
name | gender | community | zone | token
```

**Example Excel:**

| name | gender | community | zone | token |
|------|--------|-----------|------|-------|
| Chief John Owei | Male | Oporoma | CENTRAL ZONE | |
| Dr. Mary Ebiere | Female | Yenagoa | EASTERN ZONE | |
| Hon. Peter George | Male | Sagbama | WESTERN ZONE | |

**Important:**
- ✅ `name` is REQUIRED
- ✅ Leave `token` column EMPTY (auto-generates)
- ✅ Gender: Male or Female
- ✅ Zone: CENTRAL ZONE, EASTERN ZONE, or WESTERN ZONE
- ✅ Can have 10, 100, or 1000 delegates

**Template:**
```bash
# Generate a template
node create-full-templates.js
# Opens: delegates_template.csv
```

---

### B. Candidates File

**Create:** `candidates.xlsx` or `candidates.csv`

**Required columns:**
```
position_id | candidate_name | gender | community | zone | image_url | display_order
```

**Example Excel:**

| position_id | candidate_name | gender | community | zone | image_url | display_order |
|-------------|----------------|--------|-----------|------|-----------|---------------|
| 1 | Chief John Owei | Male | Oporoma | CENTRAL ZONE | /candidates/owei.jpg | 1 |
| 1 | Dr. Mary Ebiere | Female | Yenagoa | CENTRAL ZONE | /candidates/ebiere.jpg | 2 |
| 2 | Hon. Peter Tonye | Male | Sagbama | CENTRAL ZONE | | 1 |

**Important:**
- ✅ `position_id`: Must be 1-14 (see positions reference below)
- ✅ `candidate_name`: REQUIRED
- ✅ `image_url`: Optional (leave empty for no photo)
- ✅ `display_order`: Optional (auto-assigns if empty)

**Position IDs:**
```
1  = President (CENTRAL)
2  = Vice President 3 (CENTRAL)
3  = National Auditor (CENTRAL)
4  = National Publicity Secretary (CENTRAL)
5  = National Assistant Secretary (CENTRAL)
6  = Vice President 2 (EASTERN)
7  = National Secretary (EASTERN)
8  = National Legal Adviser (EASTERN)
9  = National Financial Secretary (EASTERN)
10 = National Welfare Secretary (EASTERN)
11 = Vice President 1 (WESTERN)
12 = National Organising Secretary (WESTERN)
13 = National Treasurer (WESTERN)
14 = National Women Affairs Secretary (WESTERN)
```

---

## **STEP 3: Import Delegates**

### PostgreSQL:
```bash
node import-delegates-postgres.js delegates.csv
```

### SQLite:
```bash
node import-delegates-full.js delegates.csv
```

**What happens:**
1. Reads your Excel/CSV file
2. Asks if you want to clear existing data
3. **Auto-generates unique tokens** for each delegate (e.g., `INC-1-A1B2C3D4E5F6`)
4. Imports all delegates to database

**✅ Expected Output:**
```
📥 IMPORTING DELEGATES

Found 1000 delegates to import

⚠️  Clear existing delegates first? (yes/no): yes
🗑️  Clearing existing delegates...
✓ Existing delegates cleared

✓ Chief John Owei | Male | Oporoma | CENTRAL ZONE → INC-1-A1B2C3D4E5F6
✓ Dr. Mary Ebiere | Female | Yenagoa | EASTERN ZONE → INC-1-B2C3D4E5F6A7
✓ Hon. Peter George | Male | Sagbama | WESTERN ZONE → INC-1-C3D4E5F6A7B8
...

✅ IMPORT COMPLETE
   Imported: 1000
   Skipped:  0
   Errors:   0

📊 Delegates by Zone:
   CENTRAL ZONE: 334
   EASTERN ZONE: 333
   WESTERN ZONE: 333
```

---

## **STEP 4: Import Candidates**

### PostgreSQL:
```bash
node import-candidates-postgres.js candidates.csv
```

### SQLite:
```bash
node import-candidates-full.js candidates.csv
```

**What happens:**
1. Reads your candidates file
2. Validates position_ids
3. Imports candidates for each position

**✅ Expected Output:**
```
📥 IMPORTING CANDIDATES

Found 28 candidates to import

⚠️  Clear existing candidates first? (yes/no): yes
✓ Existing candidates cleared

✓ [President] Chief John Owei | Male | Oporoma | CENTRAL ZONE
✓ [President] Dr. Mary Ebiere | Female | Yenagoa | CENTRAL ZONE
✓ [Vice President 3] Hon. Peter Tonye | Male | Sagbama | CENTRAL ZONE
...

✅ IMPORT COMPLETE
   Imported: 28
   Skipped:  0
   Errors:   0

📊 Candidates by Zone:
   CENTRAL ZONE: 10
   EASTERN ZONE: 10
   WESTERN ZONE: 8
```

---

## **STEP 5: Generate QR Codes**

```bash
node generate-qr-codes.js
```

**What happens:**
1. Reads all delegates from database
2. Generates a unique QR code for each delegate's token
3. Creates individual PNG files
4. Creates an HTML page with all QR codes

**✅ Expected Output:**
```
🎯 Generating QR Codes for INC Delegates...

Found 1000 delegates. Generating QR codes...

✓ Chief John Owei - 1_Chief_John_Owei.png
✓ Dr. Mary Ebiere - 2_Dr_Mary_Ebiere.png
✓ Hon. Peter George - 3_Hon_Peter_George.png
...

✅ QR codes saved to 'qr-codes/' directory
📄 HTML page created: delegate-qr-codes.html
   Open this file in a browser to view/print all QR codes.
```

**Files created:**
```
qr-codes/
├── 1_Chief_John_Owei.png
├── 2_Dr_Mary_Ebiere.png
├── 3_Hon_Peter_George.png
└── ... (1000 total)

delegate-qr-codes.html  ← Open in browser to print
```

---

## **STEP 6: Print QR Codes**

```bash
# Open the HTML file in your browser
open delegate-qr-codes.html   # Mac
start delegate-qr-codes.html  # Windows
xdg-open delegate-qr-codes.html  # Linux
```

**Printing Options:**

### Option A: Print All at Once
1. Open `delegate-qr-codes.html` in Chrome/Firefox
2. Press `Ctrl+P` (or `Cmd+P` on Mac)
3. Select printer
4. Print all pages
5. Cut into individual cards

### Option B: Print Individual QR Codes
1. Navigate to `qr-codes/` folder
2. Select specific delegates
3. Print selected images
4. Laminate for durability

### Option C: Professional Printing
1. Send `qr-codes/` folder to printing service
2. Print on PVC cards or stickers
3. Add delegate name and photo

**Recommended QR Code Size:**
- Minimum: 2cm × 2cm (for phone scanning)
- Recommended: 5cm × 5cm (easier to scan)

---

## **STEP 7: Verify Everything**

```bash
# Check system status
node check-status.js

# For PostgreSQL:
node check-status-postgres.js
```

**✅ Expected Output:**
```
🔍 INC Voting System Status Check
==================================================

✅ DATABASE: Connected

   📋 Total delegates: 1000
   ✓ Voted: 0 (0.0%)
   ✓ Eligible: 1000

   📊 Vote Distribution:
      No votes cast yet

🌐 SERVER CHECK:
   ✅ Backend server: Running on port 3000
   ✅ API responding correctly

💡 RECOMMENDATIONS:
   ✓ QR codes folder exists (1000 files)
   ✓ QR codes HTML page exists

✨ Status check complete!
```

---

## **STEP 8: Start Voting System**

### Terminal 1: Start Backend

**PostgreSQL:**
```bash
node server-postgres.js
```

**SQLite:**
```bash
node server.js
```

**✅ Expected:**
```
✨ INC Multi-Position Voting System running
🚀 Server: http://localhost:3000
📊 Positions: 14
🗳️  Ready for voting!
```

### Terminal 2: Start Frontend

```bash
npm start
```

**✅ Expected:**
```
Compiled successfully!

Local:            http://localhost:3001
```

---

## **STEP 9: Test Before Election Day**

### Test Workflow:

1. **Open browser:** http://localhost:3001/

2. **Test verification:**
   - Use first delegate's token (check QR code or database)
   - Click "SCAN QR WITH CAMERA" or enter token manually
   - Click "VERIFY"
   - Should show: "Delegate verified: [Name]"

3. **Test voting:**
   - Click "PROCEED TO VOTE"
   - Go through all 14 positions
   - Select candidates
   - Click "SUBMIT ALL VOTES"
   - Should show: "Vote Submitted!"

4. **Test dashboard:**
   - Open http://localhost:3001/dashboard
   - Should show 1 vote for each candidate you selected
   - Updates in real-time

5. **Test duplicate prevention:**
   - Try to vote with the same token again
   - Should show: "This delegate has ALREADY VOTED"

---

## **STEP 10: Election Day Setup**

### Morning Checklist:

```bash
# 1. Verify database
node check-status.js

# 2. Backup database
# PostgreSQL:
pg_dump inc_voting > backup_$(date +%Y%m%d).sql

# SQLite:
cp inc_votes.db backup_$(date +%Y%m%d).db

# 3. Start servers
node server-postgres.js  # Terminal 1
npm start                # Terminal 2

# 4. Open dashboard on display screen
# http://localhost:3001/dashboard

# 5. Test one vote
# Use a test token to verify everything works

# 6. Ready! ✅
```

---

## 📊 **Quick Reference Commands**

```bash
# Setup
createdb inc_voting                           # Create database
node server-postgres.js                       # Start server

# Import Data
node import-delegates-postgres.js delegates.csv
node import-candidates-postgres.js candidates.csv

# Generate QR Codes
node generate-qr-codes.js

# Verify
node check-status.js                          # Check system
psql inc_voting -c "SELECT COUNT(*) FROM delegates;"

# Backup
pg_dump inc_voting > backup.sql               # PostgreSQL
cp inc_votes.db backup.db                     # SQLite

# View Data
psql inc_voting -c "SELECT * FROM delegates LIMIT 5;"
sqlite3 inc_votes.db "SELECT * FROM delegates LIMIT 5;"
```

---

## ✅ **Complete Checklist**

- [ ] PostgreSQL/SQLite installed and running
- [ ] Empty database created
- [ ] Delegates Excel/CSV prepared (with columns: name, gender, community, zone)
- [ ] Candidates Excel/CSV prepared (with position_id, name, etc.)
- [ ] Delegates imported successfully
- [ ] Tokens auto-generated for all delegates
- [ ] Candidates imported successfully
- [ ] QR codes generated (1000 files)
- [ ] QR codes printed/prepared
- [ ] System tested with test vote
- [ ] Dashboard working
- [ ] Backup taken
- [ ] Ready for election! 🎉

---

## 🎯 **Summary**

**Your Workflow:**
1. ✅ Setup empty database → `createdb inc_voting`
2. ✅ Import delegates Excel → Tokens **auto-generate**
3. ✅ Import candidates Excel
4. ✅ Generate QR codes → `node generate-qr-codes.js`
5. ✅ Print QR codes → Open `delegate-qr-codes.html`
6. ✅ Start system → Ready to vote!

**Tokens are automatically generated during import - you don't need to create them manually!**

Each delegate gets a unique token like: `INC-1-A1B2C3D4E5F6`

---

**That's it! Your production workflow is complete and ready to go! 🚀**