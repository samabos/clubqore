# Recurring Events Architecture - Option B (Recommended)

## Problem Statement

Current implementation materializes all recurring occurrences as separate database rows. Issues:
- Editing one occurrence doesn't update others
- No "Edit This" vs "Edit All" vs "Edit Future" functionality
- Difficult to manage recurring series

## Solution: Hybrid Virtual Recurrence with Exceptions

### Core Concept

1. **Store only parent rule** in `training_sessions` table (is_recurring = true)
2. **Generate occurrences on-the-fly** when fetching schedule
3. **Store exceptions** in separate `training_session_exceptions` table
4. **Apply exceptions** when generating occurrences

### Database Schema

#### Existing: training_sessions table
```sql
CREATE TABLE training_sessions (
  id INTEGER PRIMARY KEY,
  -- ... other fields ...
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern ENUM('daily', 'weekly', 'biweekly', 'monthly'),
  recurrence_days TEXT, -- JSON array like "[1,3,5]" for Mon, Wed, Fri
  recurrence_end_date DATE,
  parent_session_id INTEGER -- NOW ALWAYS NULL (no child rows)
);
```

#### NEW: training_session_exceptions table
```sql
CREATE TABLE training_session_exceptions (
  id INTEGER PRIMARY KEY,
  training_session_id INTEGER NOT NULL, -- References parent session
  occurrence_date DATE NOT NULL, -- Which occurrence this affects
  exception_type ENUM('cancelled', 'rescheduled', 'modified'),

  -- Override fields (NULL = use parent value)
  override_date DATE,
  override_start_time TIME,
  override_end_time TIME,
  override_title VARCHAR(255),
  override_description TEXT,
  override_location VARCHAR(255),
  override_coach_id INTEGER,
  override_max_participants INTEGER,
  override_status ENUM('draft', 'scheduled', 'completed', 'cancelled'),

  created_by INTEGER NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  UNIQUE(training_session_id, occurrence_date),
  FOREIGN KEY (training_session_id) REFERENCES training_sessions(id) ON DELETE CASCADE
);
```

---

## Backend Implementation

### 1. Service Layer - Generate Occurrences

```javascript
// TrainingSessionService.js

/**
 * Generate virtual occurrences for a recurring session
 * @param {Object} parentSession - The parent recurring session
 * @param {Date} fromDate - Start of date range
 * @param {Date} toDate - End of date range
 * @returns {Array} Array of occurrence objects
 */
async generateOccurrences(parentSession, fromDate, toDate) {
  if (!parentSession.is_recurring) {
    // Non-recurring, return single occurrence
    return [{
      ...parentSession,
      occurrence_date: parentSession.date,
      is_exception: false
    }];
  }

  // Get all exceptions for this session
  const exceptions = await this.db('training_session_exceptions')
    .where('training_session_id', parentSession.id)
    .select('*');

  const exceptionMap = new Map(
    exceptions.map(ex => [ex.occurrence_date, ex])
  );

  // Generate date range from recurrence rule
  const dates = this.generateRecurringDates(
    parentSession.date,
    parentSession.recurrence_pattern,
    parentSession.recurrence_end_date || toDate,
    parentSession.recurrence_days ? JSON.parse(parentSession.recurrence_days) : null
  );

  // Filter to requested date range
  const filteredDates = dates.filter(date => {
    const d = new Date(date);
    return d >= fromDate && d <= toDate;
  });

  // Build occurrences with exceptions applied
  const occurrences = [];

  for (const date of filteredDates) {
    const exception = exceptionMap.get(date);

    // Skip cancelled occurrences
    if (exception && exception.exception_type === 'cancelled') {
      continue;
    }

    // Build occurrence
    const occurrence = {
      ...parentSession,
      occurrence_date: exception?.override_date || date,

      // Apply overrides if exception exists
      date: exception?.override_date || date,
      start_time: exception?.override_start_time || parentSession.start_time,
      end_time: exception?.override_end_time || parentSession.end_time,
      title: exception?.override_title || parentSession.title,
      description: exception?.override_description || parentSession.description,
      location: exception?.override_location || parentSession.location,
      coach_id: exception?.override_coach_id || parentSession.coach_id,
      max_participants: exception?.override_max_participants || parentSession.max_participants,
      status: exception?.override_status || parentSession.status,

      // Metadata
      is_exception: !!exception,
      exception_id: exception?.id || null,
      exception_type: exception?.exception_type || null
    };

    occurrences.push(occurrence);
  }

  return occurrences;
}

/**
 * Get schedule with recurring sessions expanded
 */
async getSchedule(clubId, fromDate, toDate, filters = {}) {
  // Fetch all parent sessions (non-recurring + recurring parents)
  const sessions = await this.db('training_sessions')
    .where('club_id', clubId)
    .where(function() {
      // Include non-recurring sessions in date range
      this.where('is_recurring', false)
        .whereBetween('date', [fromDate, toDate])
        // OR recurring sessions that might have occurrences in range
        .orWhere(function() {
          this.where('is_recurring', true)
            .where('date', '<=', toDate)
            .where(function() {
              this.where('recurrence_end_date', '>=', fromDate)
                .orWhereNull('recurrence_end_date');
            });
        });
    })
    .select('*');

  // Expand recurring sessions into occurrences
  const allOccurrences = [];

  for (const session of sessions) {
    const occurrences = await this.generateOccurrences(
      session,
      new Date(fromDate),
      new Date(toDate)
    );
    allOccurrences.push(...occurrences);
  }

  // Sort by date
  allOccurrences.sort((a, b) => {
    const dateCompare = new Date(a.date) - new Date(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.start_time.localeCompare(b.start_time);
  });

  return allOccurrences;
}
```

### 2. Exception Management

```javascript
// TrainingSessionService.js

/**
 * Cancel a single occurrence
 */
async cancelOccurrence(sessionId, occurrenceDate, userId) {
  return await this.db('training_session_exceptions').insert({
    training_session_id: sessionId,
    occurrence_date: occurrenceDate,
    exception_type: 'cancelled',
    created_by: userId,
    created_at: new Date(),
    updated_at: new Date()
  });
}

/**
 * Reschedule a single occurrence
 */
async rescheduleOccurrence(sessionId, occurrenceDate, newDate, newStartTime, newEndTime, userId) {
  return await this.db('training_session_exceptions').insert({
    training_session_id: sessionId,
    occurrence_date: occurrenceDate,
    exception_type: 'rescheduled',
    override_date: newDate,
    override_start_time: newStartTime,
    override_end_time: newEndTime,
    created_by: userId,
    created_at: new Date(),
    updated_at: new Date()
  }).onConflict(['training_session_id', 'occurrence_date']).merge();
}

/**
 * Modify a single occurrence (change any field)
 */
async modifyOccurrence(sessionId, occurrenceDate, overrides, userId) {
  const exceptionData = {
    training_session_id: sessionId,
    occurrence_date: occurrenceDate,
    exception_type: 'modified',
    created_by: userId,
    created_at: new Date(),
    updated_at: new Date()
  };

  // Add overrides
  Object.keys(overrides).forEach(key => {
    exceptionData[`override_${key}`] = overrides[key];
  });

  return await this.db('training_session_exceptions')
    .insert(exceptionData)
    .onConflict(['training_session_id', 'occurrence_date'])
    .merge();
}

/**
 * Edit all future occurrences (split recurring series)
 */
async editFutureOccurrences(sessionId, occurrenceDate, updates, userId) {
  return await this.db.transaction(async (trx) => {
    // 1. Update parent session's end date to day before split
    const splitDate = new Date(occurrenceDate);
    const dayBefore = new Date(splitDate);
    dayBefore.setDate(dayBefore.getDate() - 1);

    await trx('training_sessions')
      .where('id', sessionId)
      .update({ recurrence_end_date: dayBefore.toISOString().split('T')[0] });

    // 2. Create new recurring session starting from split date
    const parentSession = await trx('training_sessions')
      .where('id', sessionId)
      .first();

    const newSessionData = {
      ...parentSession,
      ...updates,
      id: undefined, // Let DB generate new ID
      date: occurrenceDate,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [newSessionId] = await trx('training_sessions')
      .insert(newSessionData)
      .returning('id');

    return newSessionId;
  });
}

/**
 * Edit entire recurring series
 */
async editAllOccurrences(sessionId, updates, userId) {
  // Simply update the parent session
  return await this.db('training_sessions')
    .where('id', sessionId)
    .update({
      ...updates,
      updated_at: new Date()
    });
}
```

---

## Frontend Implementation

### 1. Recurring Edit Dialog Component

```typescript
// RecurringEditDialog.tsx

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface RecurringEditDialogProps {
  open: boolean;
  onClose: () => void;
  onEditScope: (scope: "this" | "all" | "future") => void;
  eventTitle: string;
  occurrenceDate: string;
}

export function RecurringEditDialog({
  open,
  onClose,
  onEditScope,
  eventTitle,
  occurrenceDate
}: RecurringEditDialogProps) {
  const [scope, setScope] = useState<"this" | "all" | "future">("this");

  const handleConfirm = () => {
    onEditScope(scope);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Recurring Event</DialogTitle>
          <DialogDescription>
            "{eventTitle}" is a recurring event. How would you like to edit it?
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={scope} onValueChange={(v) => setScope(v as any)}>
          <div className="flex items-start space-x-3 space-y-0 p-4 border rounded-lg">
            <RadioGroupItem value="this" id="this" />
            <div className="space-y-1 flex-1">
              <Label htmlFor="this" className="font-medium cursor-pointer">
                Only this event
              </Label>
              <p className="text-sm text-gray-500">
                Changes will only apply to {occurrenceDate}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 space-y-0 p-4 border rounded-lg">
            <RadioGroupItem value="future" id="future" />
            <div className="space-y-1 flex-1">
              <Label htmlFor="future" className="font-medium cursor-pointer">
                This and future events
              </Label>
              <p className="text-sm text-gray-500">
                Changes will apply from {occurrenceDate} onwards
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 space-y-0 p-4 border rounded-lg">
            <RadioGroupItem value="all" id="all" />
            <div className="space-y-1 flex-1">
              <Label htmlFor="all" className="font-medium cursor-pointer">
                All events
              </Label>
              <p className="text-sm text-gray-500">
                Changes will apply to all occurrences in this series
              </p>
            </div>
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 2. Integration in Schedule Component

```typescript
// schedule-management.page.tsx

const [showRecurringDialog, setShowRecurringDialog] = useState(false);
const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

const handleEditClick = (item: ScheduleItem) => {
  if (item.type === "training" && item.data.is_recurring) {
    setEditingItem(item);
    setShowRecurringDialog(true);
  } else {
    // Direct edit for non-recurring
    openEditDialog(item);
  }
};

const handleEditScope = async (scope: "this" | "all" | "future") => {
  if (!editingItem) return;

  if (scope === "this") {
    // Open edit dialog, save as exception
    setEditMode("exception");
    openEditDialog(editingItem);
  } else if (scope === "all") {
    // Open edit dialog, update parent session
    setEditMode("all");
    openEditDialog(editingItem);
  } else if (scope === "future") {
    // Open edit dialog, will split series
    setEditMode("future");
    openEditDialog(editingItem);
  }
};

// In render:
<RecurringEditDialog
  open={showRecurringDialog}
  onClose={() => setShowRecurringDialog(false)}
  onEditScope={handleEditScope}
  eventTitle={editingItem?.data.title || ""}
  occurrenceDate={editingItem?.occurrence_date || ""}
/>
```

---

## API Endpoints

### GET /api/schedule
```javascript
// Returns virtual occurrences with exceptions applied
router.get('/schedule', async (request, reply) => {
  const { from_date, to_date } = request.query;
  const clubId = request.user.club_id;

  const occurrences = await trainingSessionService.getSchedule(
    clubId,
    from_date,
    to_date
  );

  return reply.send(occurrences);
});
```

### PATCH /api/training-sessions/:id/occurrences/:date
```javascript
// Edit single occurrence (create exception)
router.patch('/:id/occurrences/:date', async (request, reply) => {
  const { id, date } = request.params;
  const updates = request.body;
  const userId = request.user.id;

  await trainingSessionService.modifyOccurrence(
    id,
    date,
    updates,
    userId
  );

  return reply.send({ success: true });
});
```

### PATCH /api/training-sessions/:id
```javascript
// Edit entire series (update parent)
router.patch('/:id', async (request, reply) => {
  const { id } = request.params;
  const updates = request.body;
  const userId = request.user.id;

  await trainingSessionService.editAllOccurrences(
    id,
    updates,
    userId
  );

  return reply.send({ success: true });
});
```

### PATCH /api/training-sessions/:id/occurrences/:date/future
```javascript
// Edit this and future occurrences (split series)
router.patch('/:id/occurrences/:date/future', async (request, reply) => {
  const { id, date } = request.params;
  const updates = request.body;
  const userId = request.user.id;

  const newSeriesId = await trainingSessionService.editFutureOccurrences(
    id,
    date,
    updates,
    userId
  );

  return reply.send({ success: true, new_series_id: newSeriesId });
});
```

---

## Migration Strategy

### Step 1: Create exceptions table
```bash
npm run migrate:make create_training_session_exceptions
```

### Step 2: Migrate existing data
```javascript
// In migration
exports.up = async function(knex) {
  // 1. Create exceptions table
  await knex.schema.createTable('training_session_exceptions', ...);

  // 2. Find all child sessions (parent_session_id IS NOT NULL)
  const childSessions = await knex('training_sessions')
    .whereNotNull('parent_session_id');

  // 3. For each child, check if it differs from parent
  for (const child of childSessions) {
    const parent = await knex('training_sessions')
      .where('id', child.parent_session_id)
      .first();

    // If child was modified, create exception
    if (child.start_time !== parent.start_time ||
        child.location !== parent.location ||
        // ... check other fields
    ) {
      await knex('training_session_exceptions').insert({
        training_session_id: parent.id,
        occurrence_date: child.date,
        exception_type: 'modified',
        override_start_time: child.start_time !== parent.start_time ? child.start_time : null,
        override_location: child.location !== parent.location ? child.location : null,
        // ... other overrides
        created_by: child.created_by
      });
    }
  }

  // 4. Delete all child sessions
  await knex('training_sessions')
    .whereNotNull('parent_session_id')
    .delete();
};
```

---

## Benefits of Option B

✅ **Single source of truth**: Parent session defines the rule
✅ **Flexible exceptions**: Cancel, reschedule, or modify any occurrence
✅ **Edit granularity**: Edit this, all, or future occurrences
✅ **Performance**: No unnecessary database rows
✅ **Maintainability**: Clear separation between rule and exceptions
✅ **Scalability**: Weekly sessions for a year = 1 row + exceptions (not 52 rows)

---

## Comparison with Option A

**Option A** (Pure Virtual):
- Generates occurrences on-the-fly ✅
- Needs exceptions table to handle cancellations ⚠️
- Essentially becomes Option B ⚠️

**Option B** (Hybrid with Exceptions):
- Generates occurrences on-the-fly ✅
- Built-in exception handling ✅
- Designed for real-world edge cases ✅
- **Recommended approach** ⭐

---

## Next Steps

1. Review and approve this architecture
2. Run migration to create `training_session_exceptions` table
3. Update `TrainingSessionService` with occurrence generation logic
4. Create `RecurringEditDialog` component
5. Update API endpoints to support exception operations
6. Migrate existing child sessions to exceptions
7. Test all three edit scopes (this, all, future)
8. Apply same pattern to `matches` table
