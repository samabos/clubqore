# Google Calendar Integration Guide

## Overview

Allow users to export ClubQore training sessions and matches to their personal Google Calendar. When combined with the Virtual Recurrence architecture (Option B), this provides seamless calendar sync.

---

## Architecture: Export-Only Sync (Recommended)

**Flow:**
1. User clicks "Add to Google Calendar" on an event or "Sync All" for entire schedule
2. ClubQore generates virtual occurrences (with exceptions applied)
3. Each occurrence is created as a Google Calendar event
4. ClubQore stores Google Calendar event IDs for future updates
5. When ClubQore event is edited/cancelled → Update/delete corresponding Google Calendar event

**Benefits:**
- Simple, reliable
- No conflict resolution needed
- Works with virtual recurrence architecture
- Users get notifications on their devices

---

## Setup: Google Calendar API

### 1. Enable Google Calendar API

```bash
# 1. Go to Google Cloud Console
https://console.cloud.google.com/

# 2. Create new project or select existing
# 3. Enable Google Calendar API
https://console.cloud.google.com/apis/library/calendar-json.googleapis.com

# 4. Create OAuth 2.0 credentials
# - Application type: Web application
# - Authorized redirect URIs: http://localhost:3001/auth/google/callback
# - Download credentials JSON
```

### 2. Environment Variables

```bash
# backend/.env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
```

### 3. Install Dependencies

```bash
cd backend
npm install googleapis
```

---

## Database Schema

### New Table: google_calendar_sync

```sql
CREATE TABLE google_calendar_sync (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- User who authorized sync
  user_id INTEGER NOT NULL,

  -- Google OAuth tokens
  google_access_token TEXT NOT NULL,
  google_refresh_token TEXT NOT NULL,
  google_token_expires_at TIMESTAMP NOT NULL,

  -- User's primary Google Calendar ID (usually their email)
  google_calendar_id VARCHAR(255) NOT NULL,

  -- Sync preferences
  sync_training_sessions BOOLEAN DEFAULT true,
  sync_matches BOOLEAN DEFAULT true,
  auto_sync BOOLEAN DEFAULT true, -- Auto-sync when events change

  -- Metadata
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id)
);

CREATE INDEX idx_google_calendar_sync_user_id ON google_calendar_sync(user_id);
```

### New Table: google_calendar_events

```sql
CREATE TABLE google_calendar_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Link to ClubQore event
  event_type ENUM('training_session', 'match') NOT NULL,
  event_id INTEGER NOT NULL, -- training_session.id or match.id
  occurrence_date DATE, -- For recurring events, which occurrence

  -- Link to user
  user_id INTEGER NOT NULL,

  -- Google Calendar event ID
  google_event_id VARCHAR(255) NOT NULL,
  google_calendar_id VARCHAR(255) NOT NULL,

  -- Metadata
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Unique constraint: one Google event per ClubQore occurrence per user
  UNIQUE(event_type, event_id, occurrence_date, user_id)
);

CREATE INDEX idx_google_calendar_events_event ON google_calendar_events(event_type, event_id);
CREATE INDEX idx_google_calendar_events_user ON google_calendar_events(user_id);
```

---

## Backend Implementation

### 1. Google OAuth Service

```javascript
// backend/src/services/GoogleCalendarService.js

import { google } from 'googleapis';

export class GoogleCalendarService {
  constructor(db) {
    this.db = db;
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generate Google OAuth authorization URL
   */
  getAuthUrl(userId) {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId.toString(), // Pass userId to callback
      prompt: 'consent' // Force to get refresh token
    });
  }

  /**
   * Handle OAuth callback and store tokens
   */
  async handleCallback(code, userId) {
    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);

      // Get user's email (primary calendar ID)
      this.oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();

      // Store in database
      await this.db('google_calendar_sync')
        .insert({
          user_id: userId,
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_token_expires_at: new Date(tokens.expiry_date),
          google_calendar_id: data.email,
          last_synced_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        })
        .onConflict('user_id')
        .merge();

      return { success: true, email: data.email };
    } catch (error) {
      console.error('Google OAuth error:', error);
      throw new Error('Failed to connect Google Calendar');
    }
  }

  /**
   * Get authenticated calendar client for user
   */
  async getCalendarClient(userId) {
    const sync = await this.db('google_calendar_sync')
      .where('user_id', userId)
      .first();

    if (!sync) {
      throw new Error('Google Calendar not connected');
    }

    // Check if token expired
    const now = new Date();
    if (new Date(sync.google_token_expires_at) <= now) {
      // Refresh token
      this.oauth2Client.setCredentials({
        refresh_token: sync.google_refresh_token
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      // Update tokens
      await this.db('google_calendar_sync')
        .where('user_id', userId)
        .update({
          google_access_token: credentials.access_token,
          google_token_expires_at: new Date(credentials.expiry_date),
          updated_at: new Date()
        });

      this.oauth2Client.setCredentials(credentials);
    } else {
      this.oauth2Client.setCredentials({
        access_token: sync.google_access_token,
        refresh_token: sync.google_refresh_token
      });
    }

    return {
      calendar: google.calendar({ version: 'v3', auth: this.oauth2Client }),
      calendarId: sync.google_calendar_id
    };
  }

  /**
   * Sync a training session occurrence to Google Calendar
   */
  async syncTrainingSession(userId, sessionOccurrence) {
    const { calendar, calendarId } = await this.getCalendarClient(userId);

    // Check if already synced
    const existing = await this.db('google_calendar_events')
      .where({
        event_type: 'training_session',
        event_id: sessionOccurrence.id,
        occurrence_date: sessionOccurrence.occurrence_date || sessionOccurrence.date,
        user_id: userId
      })
      .first();

    // Build Google Calendar event
    const event = {
      summary: sessionOccurrence.title,
      description: sessionOccurrence.description || '',
      location: sessionOccurrence.location || '',
      start: {
        dateTime: `${sessionOccurrence.date}T${sessionOccurrence.start_time}`,
        timeZone: 'America/New_York' // TODO: Get from user settings
      },
      end: {
        dateTime: `${sessionOccurrence.date}T${sessionOccurrence.end_time}`,
        timeZone: 'America/New_York'
      },
      colorId: '9', // Blue for training
      source: {
        title: 'ClubQore',
        url: `http://localhost:3001/app/schedule`
      }
    };

    if (existing) {
      // Update existing event
      await calendar.events.update({
        calendarId,
        eventId: existing.google_event_id,
        resource: event
      });

      await this.db('google_calendar_events')
        .where('id', existing.id)
        .update({ synced_at: new Date(), updated_at: new Date() });

      return { action: 'updated', google_event_id: existing.google_event_id };
    } else {
      // Create new event
      const response = await calendar.events.insert({
        calendarId,
        resource: event
      });

      // Store mapping
      await this.db('google_calendar_events').insert({
        event_type: 'training_session',
        event_id: sessionOccurrence.id,
        occurrence_date: sessionOccurrence.occurrence_date || sessionOccurrence.date,
        user_id: userId,
        google_event_id: response.data.id,
        google_calendar_id: calendarId,
        synced_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });

      return { action: 'created', google_event_id: response.data.id };
    }
  }

  /**
   * Sync a match occurrence to Google Calendar
   */
  async syncMatch(userId, matchOccurrence) {
    const { calendar, calendarId } = await this.getCalendarClient(userId);

    const existing = await this.db('google_calendar_events')
      .where({
        event_type: 'match',
        event_id: matchOccurrence.id,
        occurrence_date: matchOccurrence.occurrence_date || matchOccurrence.date,
        user_id: userId
      })
      .first();

    const title = matchOccurrence.is_home
      ? `Match vs ${matchOccurrence.opponent}`
      : `Match @ ${matchOccurrence.opponent}`;

    const event = {
      summary: title,
      description: `${matchOccurrence.match_type} match\n${matchOccurrence.competition || ''}`,
      location: matchOccurrence.location || '',
      start: {
        dateTime: `${matchOccurrence.date}T${matchOccurrence.start_time}`,
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: `${matchOccurrence.date}T${matchOccurrence.end_time || matchOccurrence.start_time}`,
        timeZone: 'America/New_York'
      },
      colorId: '10', // Green for matches
      source: {
        title: 'ClubQore',
        url: `http://localhost:3001/app/schedule`
      }
    };

    if (existing) {
      await calendar.events.update({
        calendarId,
        eventId: existing.google_event_id,
        resource: event
      });

      await this.db('google_calendar_events')
        .where('id', existing.id)
        .update({ synced_at: new Date(), updated_at: new Date() });

      return { action: 'updated', google_event_id: existing.google_event_id };
    } else {
      const response = await calendar.events.insert({
        calendarId,
        resource: event
      });

      await this.db('google_calendar_events').insert({
        event_type: 'match',
        event_id: matchOccurrence.id,
        occurrence_date: matchOccurrence.occurrence_date || matchOccurrence.date,
        user_id: userId,
        google_event_id: response.data.id,
        google_calendar_id: calendarId,
        synced_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });

      return { action: 'created', google_event_id: response.data.id };
    }
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteEventFromGoogle(userId, eventType, eventId, occurrenceDate) {
    const { calendar } = await this.getCalendarClient(userId);

    const existing = await this.db('google_calendar_events')
      .where({
        event_type: eventType,
        event_id: eventId,
        occurrence_date: occurrenceDate,
        user_id: userId
      })
      .first();

    if (existing) {
      try {
        await calendar.events.delete({
          calendarId: existing.google_calendar_id,
          eventId: existing.google_event_id
        });
      } catch (error) {
        // Event might already be deleted
        console.error('Failed to delete from Google:', error.message);
      }

      await this.db('google_calendar_events')
        .where('id', existing.id)
        .delete();

      return { deleted: true };
    }

    return { deleted: false };
  }

  /**
   * Sync all upcoming events for a user
   */
  async syncAllEvents(userId, fromDate, toDate) {
    // This would call TrainingSessionService.getSchedule() to get virtual occurrences
    // Then sync each one
    // Implementation depends on your service layer structure
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnect(userId) {
    await this.db('google_calendar_sync')
      .where('user_id', userId)
      .delete();

    await this.db('google_calendar_events')
      .where('user_id', userId)
      .delete();

    return { success: true };
  }
}
```

---

## Frontend Implementation

### 1. Google Calendar Connect Button

```typescript
// frontend/src/modules/settings/components/google-calendar-settings.tsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function GoogleCalendarSettings() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/google-calendar/status', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const data = await response.json();
      setIsConnected(data.connected);
      setCalendarEmail(data.email || null);
    } catch (error) {
      console.error('Failed to check status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    // Redirect to Google OAuth
    window.location.href = '/api/google-calendar/auth';
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/google-calendar/disconnect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      setIsConnected(false);
      setCalendarEmail(null);

      toast({
        title: "Disconnected",
        description: "Google Calendar has been disconnected"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect",
        variant: "destructive"
      });
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/google-calendar/sync-all', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      toast({
        title: "Sync Complete",
        description: `Synced ${data.synced} events to Google Calendar`
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync events",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Sync your training sessions and matches to Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm">Connected to {calendarEmail}</span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSyncAll}
                disabled={isSyncing}
                variant="default"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  "Sync All Events"
                )}
              </Button>

              <Button
                onClick={handleDisconnect}
                variant="outline"
              >
                Disconnect
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              Events will automatically sync when you create or edit them in ClubQore
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Connect your Google Calendar to automatically add ClubQore events to your calendar.
              You'll receive notifications on all your devices.
            </p>

            <Button onClick={handleConnect}>
              <Calendar className="h-4 w-4 mr-2" />
              Connect Google Calendar
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

### 2. Add "Add to Calendar" Button on Event Cards

```typescript
// Update ScheduleCard component

<Button
  variant="outline"
  size="sm"
  onClick={() => handleAddToGoogleCalendar(item)}
>
  <Calendar className="h-4 w-4 mr-2" />
  Add to Calendar
</Button>
```

---

## Integration with Virtual Recurrence

### When User Edits Recurring Event

```javascript
// Example: Edit "this occurrence" only

// 1. Create exception in ClubQore
await trainingSessionService.modifyOccurrence(
  sessionId,
  occurrenceDate,
  updates,
  userId
);

// 2. Update Google Calendar event for this occurrence only
await googleCalendarService.syncTrainingSession(userId, updatedOccurrence);
```

### When User Edits "All Occurrences"

```javascript
// 1. Update parent session
await trainingSessionService.editAllOccurrences(sessionId, updates, userId);

// 2. Regenerate all occurrences
const occurrences = await trainingSessionService.generateOccurrences(
  parentSession,
  fromDate,
  toDate
);

// 3. Update all Google Calendar events
for (const occurrence of occurrences) {
  await googleCalendarService.syncTrainingSession(userId, occurrence);
}
```

---

## Benefits of This Architecture

✅ **Works seamlessly with virtual recurrence** - Each occurrence is a separate Google event
✅ **Handles exceptions elegantly** - Modified occurrences update their Google event
✅ **Users get mobile notifications** - Google Calendar sends push notifications
✅ **Offline access** - Once synced, events available offline
✅ **Automatic updates** - When ClubQore events change, Google Calendar updates
✅ **Per-user control** - Each user connects their own Google Calendar
✅ **No privacy concerns** - User explicitly authorizes access

---

## API Endpoints

```javascript
// backend/src/routes/googleCalendarRoutes.js

// Initiate OAuth
GET /api/google-calendar/auth
  → Redirects to Google OAuth consent screen

// OAuth callback
GET /api/google-calendar/callback?code=xxx&state=userId
  → Exchanges code for tokens, stores in database

// Check connection status
GET /api/google-calendar/status
  → Returns { connected: true/false, email: "user@gmail.com" }

// Sync all events
POST /api/google-calendar/sync-all
  → Syncs all upcoming events to Google Calendar

// Sync single event
POST /api/google-calendar/sync-event
  → Body: { eventType: 'training_session', eventId: 123, occurrenceDate: '2025-02-10' }

// Disconnect
POST /api/google-calendar/disconnect
  → Removes tokens and event mappings
```

---

## Parent Use Case

For parents (your original question):

```typescript
// Parent views child's schedule
// Parent clicks "Add All to My Calendar"

const handleSyncToGoogleCalendar = async () => {
  // 1. Parent authorizes Google Calendar (one-time)
  if (!isGoogleConnected) {
    window.location.href = '/api/google-calendar/auth';
    return;
  }

  // 2. Fetch child's schedule (virtual occurrences)
  const schedule = await parentAPI.getChildrenSchedule();

  // 3. Sync each event to parent's Google Calendar
  for (const session of schedule.trainingSessions) {
    await googleCalendarAPI.syncEvent({
      eventType: 'training_session',
      eventId: session.id,
      occurrenceDate: session.date
    });
  }

  toast({
    title: "Synced!",
    description: `${schedule.trainingSessions.length} events added to your Google Calendar`
  });
};
```

**Result:** Parent sees all their child's training sessions and matches in their Google Calendar, gets notifications on their phone, and everything auto-updates when the club makes changes.

---

## Next Steps

1. Set up Google Cloud project and get OAuth credentials
2. Create database tables for sync data
3. Implement `GoogleCalendarService`
4. Add "Connect Google Calendar" in user settings
5. Add "Add to Calendar" buttons on event cards
6. Test OAuth flow
7. Test sync for single events
8. Test sync for recurring events with exceptions
9. Add automatic sync hooks (when events are created/updated/deleted in ClubQore)

Would you like me to start implementing the Google Calendar integration?
