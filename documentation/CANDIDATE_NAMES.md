# Candidate Names Template

Update the names below with your actual candidates, then use them in `update-candidate-names.js`

---

## CENTRAL ZONE

### Position 1: President
- Candidate 1: **[Your Name Here]**
- Candidate 2: **[Your Name Here]**

### Position 2: Vice President 3
- Candidate 1: **[Your Name Here]**
- Candidate 2: **[Your Name Here]**

### Position 3: National Auditor
- Candidate 1: **[Your Name Here]**
- Candidate 2: **[Your Name Here]**

### Position 4: National Publicity Secretary
- Candidate 1: **[Your Name Here]**
- Candidate 2: **[Your Name Here]**

### Position 5: National Assistant Secretary
- Candidate 1: **[Your Name Here]**
- Candidate 2: **[Your Name Here]**

---

## EASTERN ZONE

### Position 6: Vice President 2
- Candidate 1: **[Your Name Here]**
- Candidate 2: **[Your Name Here]**

### Position 7: National Secretary
- Candidate 1: **[Your Name Here]**
- Candidate 2: **[Your Name Here]**

### Position 8: National Legal Adviser
- Candidate 1: **[Your Name Here]**
- Candidate 2: **[Your Name Here]**

### Position 9: National Financial Secretary
- Candidate 1: **[Your Name Here]**
- Candidate 2: **[Your Name Here]**

### Position 10: National Welfare Secretary
- Candidate 1: **[Your Name Here]**
- Candidate 2: **[Your Name Here]**

---

## WESTERN ZONE

### Position 11: Vice President 1
- Candidate 1: **[Your Name Here]**
- Candidate 2: **[Your Name Here]**

### Position 12: National Organising Secretary
- Candidate 1: **[Your Name Here]**
- Candidate 2: **[Your Name Here]**

### Position 13: National Treasurer
- Candidate 1: **[Your Name Here]**
- Candidate 2: **[Your Name Here]**

### Position 14: National Women Affairs Secretary
- Candidate 1: **[Your Name Here]**
- Candidate 2: **[Your Name Here]**

---

## Quick SQL Update (Alternative)

If you prefer SQL, update names directly:

```sql
-- Position 1: President
UPDATE candidates SET name = 'Chief John Doe' WHERE position_id = 1 AND display_order = 1;
UPDATE candidates SET name = 'Dr. Jane Smith' WHERE position_id = 1 AND display_order = 2;

-- Position 2: Vice President 3
UPDATE candidates SET name = 'Hon. Peter Johnson' WHERE position_id = 2 AND display_order = 1;
UPDATE candidates SET name = 'Barr. Mary Williams' WHERE position_id = 2 AND display_order = 2;

-- Continue for all positions...
```

Run with:
```bash
sqlite3 inc_votes.db < your_updates.sql
```