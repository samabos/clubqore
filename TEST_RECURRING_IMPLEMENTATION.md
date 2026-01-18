# Testing the Recurring Events Implementation

## Quick Verification Steps

### 1. Verify Database Tables Were Created

```bash
# In backend directory
cd backend
npm run knex -- migrate:status
```

You should see:
- ✅ `20260114_remove_published_status.js` - Ran
- ✅ `20260114_create_recurring_exceptions.js` - Ran

### 2. Check Database Tables Directly

```sql
-- Check if tables exist
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%exception%';
-- Should show: training_session_exceptions, match_exceptions

-- Check structure
PRAGMA table_info(training_session_exceptions);
```

### 3. Verify Backend Routes

The backend is already running on http://localhost:3000. The new routes are registered but won't show changes in the UI yet because:

**You need a RECURRING training session to edit!**

### 4. Create a Recurring Training Session (To Test)

**Option A: Via API** (Quickest test):

```bash
# Get your auth token first
TOKEN="your_access_token_here"

# Create a recurring weekly training session
curl -X POST http://localhost:3000/api/training-sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Weekly Team Training",
    "description": "Every Monday for 8 weeks",
    "session_type": "training",
    "date": "2025-02-03",
    "start_time": "18:00",
    "end_time": "20:00",
    "location": "Main Field",
    "status": "scheduled",
    "team_ids": [1],
    "is_recurring": true,
    "recurrence_pattern": "weekly",
    "recurrence_end_date": "2025-03-31"
  }'
```

**Option B: Via UI**:

1. Go to http://localhost:3001/app/schedule
2. Click "Create" → "Training Session"
3. Fill in details
4. **Important**: Enable "Recurring Session"
5. Select "Weekly" pattern
6. Set end date (e.g., 8 weeks from now)
7. Save

### 5. See the RecurringEditDialog

Once you have a recurring session:

1. Go to Schedule page (http://localhost:3001/app/schedule)
2. Find the recurring training session
3. Click **Edit** on any occurrence
4. **🎉 The RecurringEditDialog will appear!**

You'll see three beautiful options:
- 📅 **Only this event** - Highlighted in blue
- 📆 **This and future events** - With CalendarRange icon
- ✅ **All events** - With CalendarCheck icon

### 6. Test Each Edit Scope

**Test "Only This Event"**:
1. Click Edit on Week 2 occurrence
2. Select "Only this event"
3. Change time from 18:00 to 20:00
4. Save
5. ✅ Verify Week 2 shows 8pm, all others show 6pm

**Test "This and Future Events"**:
1. Click Edit on Week 4 occurrence
2. Select "This and future events"
3. Change location to "Secondary Field"
4. Save
5. ✅ Verify Weeks 1-3 show "Main Field"
6. ✅ Verify Weeks 4-8 show "Secondary Field"

**Test "All Events"**:
1. Click Edit on any occurrence
2. Select "All events"
3. Change title to "Advanced Training"
4. Save
5. ✅ Verify ALL weeks show new title

---

## Why You Don't See Changes Yet

The RecurringEditDialog is **conditionally rendered**:

```typescript
// From schedule-management.page.tsx line 263
if (isTrainingItem(item) && item.data.is_recurring) {
  // Show recurring edit dialog first
  setPendingEditItem(item);
  setShowRecurringDialog(true);
}
```

**This means**:
- ✅ Code is integrated
- ✅ Dialog component exists
- ✅ Backend API is ready
- ⏳ **You need to create a recurring session to trigger it**

---

## Quick Visual Test (No Recurring Session Needed)

If you want to see the dialog without creating a recurring session, temporarily modify the code:

```typescript
// In schedule-management.page.tsx, line 261-271
// Change this:
const handleEditItem = (item: ScheduleItem) => {
  if (isTrainingItem(item) && item.data.is_recurring) {
    setPendingEditItem(item);
    setShowRecurringDialog(true);
  } else {
    setEditingItem(item);
  }
};

// To this (temporarily):
const handleEditItem = (item: ScheduleItem) => {
  if (isTrainingItem(item)) {  // REMOVED && item.data.is_recurring
    setPendingEditItem(item);
    setShowRecurringDialog(true);
  } else {
    setEditingItem(item);
  }
};
```

Now ANY training session edit will show the dialog (for testing only).

---

## Verify Integration is Complete

### Backend Verification

```bash
# Check if new routes are registered
cd backend
grep -r "occurrences" src/club/routes/trainingSessionRoutes.js
```

Should show 6 new routes.

### Frontend Verification

```bash
# Check if dialog is imported
cd frontend
grep -r "RecurringEditDialog" src/modules/schedule/pages/schedule-management.page.tsx
```

Should show imports and usage.

### Database Verification

```bash
# Check migration status
cd backend
npm run knex -- migrate:list
```

Should show both new migrations as "complete".

---

## What Happens When You Edit a Recurring Session

### Current Flow (Before Our Changes):
1. Click Edit → Form opens immediately
2. Save → Updates that one row in database
3. Other occurrences unchanged ❌

### New Flow (With Our Implementation):
1. Click Edit on recurring session
2. **🎨 Beautiful dialog appears** with 3 options
3. Select scope
4. Form opens
5. Save → Routes to correct API:
   - **This** → Creates exception row
   - **Future** → Splits series
   - **All** → Updates parent row
6. Schedule refreshes with correct changes ✅

---

## Common Issues

### "I don't see the dialog"
**Cause**: Editing a non-recurring session
**Fix**: Create a recurring session first (set `is_recurring: true`)

### "Backend error when saving"
**Cause**: Routes not loaded (need server restart)
**Fix**: Restart backend server
```bash
cd backend
npm run dev
```

### "Dialog shows but save fails"
**Cause**: Token or auth issue
**Fix**: Check browser console for error, verify token is valid

---

## Success Indicators

When working correctly, you'll see:

✅ Dialog appears when editing recurring sessions
✅ Three options clearly displayed with icons
✅ Selected option highlighted in blue
✅ "Continue" button proceeds to edit form
✅ Save routes to correct API endpoint
✅ Success toast shows which scope was updated
✅ Schedule refreshes with changes visible

---

## Next Steps After Testing

1. **Create test recurring sessions** for your QA environment
2. **Document for your team** how to use the three edit options
3. **Optional**: Update `createSession()` to stop creating child rows
4. **Optional**: Migrate existing child sessions to exceptions
5. **Future**: Add Google Calendar integration

---

## Quick Start Command

Create a test recurring session via curl:

```bash
# Replace with your actual token
curl -X POST http://localhost:3000/api/training-sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Recurring Session",
    "session_type": "training",
    "date": "2025-02-10",
    "start_time": "18:00",
    "end_time": "20:00",
    "location": "Test Field",
    "status": "scheduled",
    "team_ids": [1],
    "is_recurring": true,
    "recurrence_pattern": "weekly",
    "recurrence_end_date": "2025-03-31"
  }'
```

Then go to schedule page and click Edit - you'll see the dialog!
