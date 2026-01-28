# INC Voting System - Visual Workflow

---

## 🎯 **The Simple Process**

```
┌─────────────────────────────────────────────────────────────┐
│                    BEFORE ELECTION DAY                      │
└─────────────────────────────────────────────────────────────┘

1️⃣  SETUP DATABASE (One time)
    ├─ Install PostgreSQL
    ├─ Create empty database: inc_voting
    └─ Start server → Tables auto-create
    
    ⏱️ Time: 5 minutes
    
2️⃣  PREPARE YOUR DATA (In Excel)
    ├─ delegates.xlsx
    │  └─ Columns: name | gender | community | zone | token (leave empty!)
    │
    └─ candidates.xlsx
       └─ Columns: position_id | name | gender | community | zone | image_url
       
    ⏱️ Time: 30-60 minutes (depending on your data)
    
3️⃣  IMPORT DELEGATES
    └─ Run: node import-delegates-postgres.js delegates.csv
       ├─ ✨ Tokens AUTO-GENERATE (INC-1-ABC123...)
       ├─ All delegates imported
       └─ Each gets unique QR code token
       
    ⏱️ Time: 1-2 minutes
    
4️⃣  IMPORT CANDIDATES  
    └─ Run: node import-candidates-postgres.js candidates.csv
       ├─ All candidates imported
       ├─ Linked to positions
       └─ Ready for voting
       
    ⏱️ Time: 30 seconds
    
5️⃣  GENERATE QR CODES
    └─ Run: node generate-qr-codes.js
       ├─ Creates 1000 QR code images
       ├─ Creates HTML page for printing
       └─ Each QR = delegate's unique token
       
    ⏱️ Time: 2-3 minutes
    
6️⃣  PRINT QR CODES
    └─ Open: delegate-qr-codes.html
       ├─ Print all pages
       ├─ Cut into cards
       └─ Distribute to delegates
       
    ⏱️ Time: 30 minutes (printing + cutting)

┌─────────────────────────────────────────────────────────────┐
│                      ELECTION DAY                           │
└─────────────────────────────────────────────────────────────┘

7️⃣  START SYSTEM
    ├─ Terminal 1: node server-postgres.js
    ├─ Terminal 2: npm start
    └─ Open dashboard on big screen
    
    ⏱️ Time: 1 minute
    
8️⃣  VOTING BEGINS
    Delegate arrives
    ↓
    Presents QR code
    ↓
    Poll worker scans
    ↓
    System verifies → ✅ Eligible
    ↓
    Delegate votes (14 positions)
    ↓
    Submit → Vote recorded
    ↓
    Dashboard updates instantly
    ↓
    Next delegate
    
    ⏱️ Time: 3-5 minutes per delegate
```

---

## 📊 **Data Flow Diagram**

```
┌───────────────┐
│  Excel Files  │
│               │
│ • delegates   │
│ • candidates  │
└───────┬───────┘
        │
        │ Import Scripts
        ↓
┌───────────────────────────────────┐
│    PostgreSQL Database            │
│                                   │
│  ┌─────────────┐                 │
│  │  delegates  │                 │
│  │  (1000 rows)│                 │
│  └─────────────┘                 │
│         ↓ has_voted               │
│  ┌─────────────┐                 │
│  │   votes     │                 │
│  │             │                 │
│  └─────────────┘                 │
│         ↑                         │
│  ┌─────────────┐                 │
│  │ candidates  │                 │
│  │  (28 rows)  │                 │
│  └─────────────┘                 │
│         ↑                         │
│  ┌─────────────┐                 │
│  │ positions   │                 │
│  │  (14 rows)  │                 │
│  └─────────────┘                 │
└───────────────────────────────────┘
        │
        │ API Endpoints
        ↓
┌───────────────────────────────────┐
│    Backend Server (Node.js)       │
│                                   │
│  • /verify-delegate               │
│  • /submit-votes                  │
│  • /results                       │
│  • /statistics                    │
└───────────────────────────────────┘
        │
        │ HTTP + WebSocket
        ↓
┌───────────────────────────────────┐
│    Frontend (React)               │
│                                   │
│  ┌──────────────┐                │
│  │ Verify Page  │                │
│  └──────────────┘                │
│         ↓                         │
│  ┌──────────────┐                │
│  │ Voting Pages │ (14 positions) │
│  └──────────────┘                │
│         ↓                         │
│  ┌──────────────┐                │
│  │  Dashboard   │ (live results) │
│  └──────────────┘                │
└───────────────────────────────────┘
```

---

## 🔄 **Token Generation Flow**

```
Excel File (delegates.csv)
└─ Row: "Chief John Owei, Male, Oporoma, CENTRAL ZONE, [EMPTY]"
   │
   │ Import Script Reads
   ↓
   Token column is empty
   │
   │ Auto-Generate
   ↓
   crypto.randomBytes(6).toString('hex')
   │
   ↓
   Token: "INC-1-A1B2C3D4E5F6"
   │
   │ Save to Database
   ↓
   Database Record:
   ├─ name: "Chief John Owei"
   ├─ gender: "Male"
   ├─ community: "Oporoma"
   ├─ zone: "CENTRAL ZONE"
   └─ token: "INC-1-A1B2C3D4E5F6" ✨ AUTO-GENERATED
   │
   │ Generate QR Code
   ↓
   QR Code Image: 1_Chief_John_Owei.png
   │
   │ Contains encoded token
   ↓
   When scanned → Returns: "INC-1-A1B2C3D4E5F6"
   │
   │ Used for verification
   ↓
   Delegate votes ✅
```

---

## 🎯 **Voting Flow (Election Day)**

```
┌──────────────┐
│   Delegate   │
│   Arrives    │
└──────┬───────┘
       │
       │ Presents QR Code
       ↓
┌──────────────────┐
│   Poll Worker    │
│                  │
│ 1. Scan QR Code  │
│    or            │
│ 2. Enter Token   │
└──────┬───────────┘
       │
       │ POST /verify-delegate {token}
       ↓
┌──────────────────────────┐
│   Backend Checks:        │
│   • Valid token?         │
│   • Already voted?       │
└──────┬───────────────────┘
       │
       ├─ ❌ Invalid → "Invalid token"
       │
       ├─ ❌ Voted → "ALREADY VOTED"
       │
       └─ ✅ Valid → "Delegate verified"
          │
          ↓
   ┌────────────────┐
   │  Voting Screen │
   │                │
   │  Position 1/14 │
   │  Select:       │
   │  ◉ Candidate A │
   │  ○ Candidate B │
   └────────┬───────┘
            │
            │ [Next] 14 times
            ↓
   ┌────────────────┐
   │  Submit Votes  │
   └────────┬───────┘
            │
            │ POST /submit-votes {token, votes[]}
            ↓
   ┌────────────────────────┐
   │  Backend:              │
   │  • Record 14 votes     │
   │  • Mark has_voted=true │
   │  • Emit socket event   │
   └────────┬───────────────┘
            │
            ├─ Database → Votes stored
            │
            └─ WebSocket → Dashboard updates
               │
               ↓
   ┌────────────────────────┐
   │  Dashboard             │
   │  Updates Instantly     │
   │                        │
   │  President:            │
   │  ▓▓▓▓▓░ 45 votes       │
   │  ▓▓▓░░░ 32 votes       │
   └────────────────────────┘
```

---

## 🏢 **Physical Setup (Election Day)**

```
┌─────────────────────────────────────────────────────────┐
│                    VOTING HALL                          │
│                                                         │
│  ┌─────────────────┐         ┌──────────────────────┐ │
│  │  Verification   │         │    Voting Booth      │ │
│  │    Station      │         │                      │ │
│  │                 │         │  [Laptop/Tablet]     │ │
│  │  [Laptop +      │    →    │                      │ │
│  │   QR Scanner]   │         │  Delegate votes      │ │
│  │                 │         │  privately           │ │
│  │  Poll worker    │         │                      │ │
│  │  scans codes    │         │                      │ │
│  └─────────────────┘         └──────────────────────┘ │
│                                                         │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │           RESULTS DASHBOARD                      │ │
│  │                                                  │ │
│  │  [Large TV/Projector showing live results]      │ │
│  │                                                  │ │
│  │   President        VP 1         VP 2            │ │
│  │   █████ 45        ████ 38      █████ 42        │ │
│  │   ███ 32          ████ 39      ███ 35          │ │
│  │                                                  │ │
│  │   Delegates voted: 77 / 1000                    │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

Equipment needed:
├─ 1-2 laptops (verification + voting)
├─ 1 webcam (for QR scanning)
├─ 1 large screen (dashboard display)
└─ Backup: printed delegate list with tokens
```

---

## ⏱️ **Timeline**

### Setup Phase (Before Election)
```
Day -7:  Setup database, import delegates
Day -6:  Import candidates, test system
Day -5:  Generate QR codes
Day -4:  Print QR codes
Day -3:  Distribute QR codes to delegates
Day -2:  Final testing
Day -1:  Backup database, prepare equipment
```

### Election Day
```
07:00 - Setup equipment, test connectivity
07:30 - Final system check
08:00 - Voting begins
     └─ Average: 4 min/delegate
     └─ With 2 booths: 30 delegates/hour
     └─ 1000 delegates = ~17 hours (with 2 booths)
     └─ Realistically: 8-10 hours with breaks
18:00 - Close voting (or when all voted)
18:30 - Final results printed
19:00 - Results announced
```

---

## 💡 **Key Points**

✅ **Tokens are AUTO-GENERATED** - Don't create them manually!

✅ **One Excel file** for delegates (name, gender, community, zone)

✅ **One Excel file** for candidates (position_id, name, etc.)

✅ **Import → Tokens generate → QR codes create** - All automatic!

✅ **Each delegate votes once** - System prevents duplicates

✅ **Results update live** - No manual counting needed

---

**This is your complete workflow! Follow it step-by-step for a successful election. 🎉**