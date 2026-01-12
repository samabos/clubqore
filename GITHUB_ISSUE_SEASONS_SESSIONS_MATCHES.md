# Feature: Seasons, Training Sessions, and Matches Management

## Summary
Implement comprehensive season, training session, and match management for club managers and team managers, including draft/publish workflows, calendar integration, and results tracking.

## Description
This feature adds the ability for club managers and team managers to:
- Create and manage seasons
- Schedule and publish training sessions for multiple teams
- Schedule matches (internal scrimmages and external opponents)
- Track match results (scores, goals, cards, substitutions)
- View all events in a calendar widget on the dashboard
- Receive notifications when events are published

## Technical Scope

### Database Schema ✅ COMPLETED
- [x] `seasons` table - Season management with start/end dates
- [x] `training_sessions` table - Training session scheduling with draft/publish status
- [x] `training_session_teams` junction table - Multi-team assignment
- [x] `matches` table - Match scheduling with support for scrimmages and external opponents
- [x] `match_events` table - Match events (goals, cards, substitutions)

Migration file: `backend/src/db/migrations/20251122000000_create_seasons_sessions_matches.js`

### Backend Services ✅ COMPLETED
- [x] `SeasonService.js` - CRUD operations for seasons
- [x] `TrainingSessionService.js` - CRUD, publish/draft, team assignment, upcoming sessions
- [x] `MatchService.js` - CRUD, publish/draft, results tracking, event logging, upcoming matches

### Backend Controllers & Routes ⏳ IN PROGRESS
- [ ] `SeasonController.js` + `seasonRoutes.js`
- [ ] `TrainingSessionController.js` + `trainingSessionRoutes.js`
- [ ] `MatchController.js` + `matchRoutes.js`
- [ ] `CalendarController.js` + `calendarRoutes.js`

### Permission Middleware ⏳ PENDING
- [ ] Role-based authorization middleware (`requireRole`, `requireClubAccess`, `requireTeamManagerAccess`)
- [ ] Resource-level permission checks (team managers can only manage their teams)
- [ ] Apply permissions to all routes

### Frontend Types & Stores ⏳ PENDING
- [ ] TypeScript interfaces for Season, TrainingSession, Match, MatchEvent, CalendarEvent
- [ ] Zustand stores with caching: `seasonsStore.ts`, `trainingSessionsStore.ts`, `matchesStore.ts`, `calendarStore.ts`
- [ ] API action files for all CRUD operations

### Season Management Module ⏳ PENDING
- [ ] `modules/season/pages/season-management.page.tsx` - List/create seasons
- [ ] `modules/season/pages/season-details.page.tsx` - View season with sessions/matches
- [ ] `modules/season/components/season-form.tsx` - Create/edit form
- [ ] `modules/season/components/season-card.tsx` - Display season card
- [ ] `modules/season/components/season-selector.tsx` - Dropdown for active season

### Training Session Module ⏳ PENDING
- [ ] `modules/training-session/pages/training-session-management.page.tsx` - List view
- [ ] `modules/training-session/pages/create-training-session.page.tsx` - Create form
- [ ] `modules/training-session/pages/training-session-details.page.tsx` - Detail view
- [ ] `modules/training-session/pages/edit-training-session.page.tsx` - Edit form
- [ ] `modules/training-session/components/training-session-form.tsx` - Reusable form
- [ ] `modules/training-session/components/training-session-card.tsx` - Display card
- [ ] `modules/training-session/components/training-session-list.tsx` - List component
- [ ] `modules/training-session/components/team-selector.tsx` - Multi-team selection
- [ ] `modules/training-session/components/status-badge.tsx` - Status indicator

Features:
- Draft/publish workflow
- Multi-team assignment
- Coach assignment
- Date/time pickers
- Session type selection (training/practice/conditioning/tactical/friendly/other)
- Max participants field

### Match Module ⏳ PENDING
- [ ] `modules/match/pages/match-management.page.tsx` - List view
- [ ] `modules/match/pages/create-match.page.tsx` - Create form
- [ ] `modules/match/pages/match-details.page.tsx` - Detail + results view
- [ ] `modules/match/pages/edit-match.page.tsx` - Edit form
- [ ] `modules/match/components/match-form.tsx` - Reusable form
- [ ] `modules/match/components/match-card.tsx` - Display card
- [ ] `modules/match/components/match-list.tsx` - List component
- [ ] `modules/match/components/match-type-selector.tsx` - Internal/external toggle
- [ ] `modules/match/components/team-vs-team.tsx` - Team selection for scrimmages
- [ ] `modules/match/components/opponent-input.tsx` - External opponent name
- [ ] `modules/match/components/match-results-form.tsx` - Score entry
- [ ] `modules/match/components/match-event-logger.tsx` - Log goals, cards, subs
- [ ] `modules/match/components/match-timeline.tsx` - Display events chronologically

Features:
- Match types: friendly/league/cup/tournament/scrimmage
- Internal scrimmage: select 2 internal teams
- External match: select 1 team + opponent name + home/away
- Competition/tournament name
- Results tracking: scores, goalscorers, cards, substitutions
- Draft/publish workflow
- Status progression: draft → published → scheduled → in_progress → completed

### Calendar Integration ⏳ PENDING
- [ ] `modules/calendar/components/calendar-widget.tsx` - Embeddable month view using `react-day-picker`
- [ ] `modules/calendar/components/event-list-modal.tsx` - Shows events for selected date
- [ ] `modules/calendar/components/event-detail-modal.tsx` - Event detail popup
- [ ] `modules/calendar/components/calendar-legend.tsx` - Color coding legend

Features:
- Month view embedded in dashboard
- Click date → show list modal with all events
- Click event → show detail modal
- Filter by team (for team managers)
- Color-code sessions/matches and teams
- Visual indicators for draft vs published

### Dashboard Updates ⏳ PENDING
- [ ] Update `UpcomingSessions` component to use real API data
- [ ] Create `UpcomingMatches` widget
- [ ] Embed `CalendarWidget` in dashboard
- [ ] Add team filter dropdown for club managers
- [ ] Update `StatsGrid` to include session/match counts
- [ ] Create Team Manager Dashboard (`modules/team/pages/team-manager-dashboard.page.tsx`)

Dashboard Features:
- **Club Manager Dashboard**: View ALL teams' events, filter by team
- **Team Manager Dashboard**: View only assigned team's events, read-only view of other teams

### Notification System ⏳ PENDING
- [ ] Create notifications when session/match is published
- [ ] Send to parents of children in assigned teams
- [ ] Email notifications via `email_outbox` table
- [ ] In-app notification system (future enhancement)

### Navigation & Routes ⏳ PENDING
- [ ] Add routes for seasons, training sessions, matches
- [ ] Update club_manager and team_manager sidebar navigation
- [ ] Add quick create buttons in dashboard

## User Stories

### Season Management
- **As a club manager**, I want to create seasons (e.g., "2024-2025 Season") so I can organize sessions and matches by time period
- **As a club manager**, I want to set one season as active so users know which season we're currently in

### Training Sessions
- **As a club manager or team manager**, I want to create training sessions and assign them to one or multiple teams
- **As a team manager**, I want to create sessions for my team and see sessions from other teams (read-only)
- **As a club/team manager**, I want to save sessions as drafts before publishing them
- **As a club/team manager**, I want to publish sessions so parents and players can see them
- **As a parent**, I want to receive a notification when a session is published for my child's team

### Matches
- **As a club/team manager**, I want to schedule matches against external opponents (friendly, league, cup, tournament)
- **As a club/team manager**, I want to schedule internal scrimmages between two of our teams
- **As a club/team manager**, I want to track match results including scores
- **As a club/team manager**, I want to log match events (goals, yellow/red cards, substitutions) with player names and match minutes
- **As a club/team manager**, I want to view a match timeline showing all events chronologically
- **As a team manager**, I can only create/edit matches for my assigned team
- **As a parent**, I want to receive a notification when a match is published for my child's team

### Calendar & Dashboard
- **As a club manager**, I want to see all upcoming sessions and matches in a calendar widget on my dashboard
- **As a team manager**, I want to see my team's upcoming sessions and matches in a calendar on my dashboard
- **As a club/team manager**, I want to click on a date in the calendar to see all events for that day
- **As a club/team manager**, I want to click on an event to see its details
- **As a club manager**, I want to filter the calendar by team to focus on a specific team's events

## Permissions

| Role | Create Season | Edit Season | Create Session | Edit Session | Create Match | Edit Match | View All Events |
|------|--------------|-------------|----------------|--------------|--------------|------------|-----------------|
| club_manager | ✅ | ✅ | ✅ (any team) | ✅ (any team) | ✅ (any team) | ✅ (any team) | ✅ |
| team_manager | ❌ | ❌ | ✅ (own team) | ✅ (own team) | ✅ (own team) | ✅ (own team) | ✅ (read-only) |

## Implementation Phases

### Phase 1: Backend Foundation ✅ COMPLETED
- Database migrations
- Backend services

### Phase 2: Backend API ⏳ IN PROGRESS
- Controllers and routes
- Permission middleware

### Phase 3: Frontend Foundation ⏳ PENDING
- TypeScript types
- Zustand stores
- API actions

### Phase 4: Feature Modules ⏳ PENDING
- Season management
- Training session management
- Match management

### Phase 5: Calendar & Dashboard ⏳ PENDING
- Calendar widget
- Dashboard integration
- Team manager dashboard

### Phase 6: Notifications & Polish ⏳ PENDING
- Notification system
- Navigation updates
- Testing and bug fixes

## Dependencies
- Existing: `react-day-picker` (v9.8.0) for calendar UI
- Existing: `date-fns` (v4.1.0) for date formatting
- Existing: Teams module (fully implemented)
- Existing: Personnel module (for coach selection)

## Technical Decisions
- Follow existing team module pattern for consistency
- Use Zustand for client state with caching
- Use `react-day-picker` for calendar component
- Implement optimistic updates for better UX
- Reuse team color coding from teams module
- Maintain existing design system (Tailwind + shadcn/ui)

## Acceptance Criteria
- [ ] Club managers can create seasons and set active season
- [ ] Club managers and team managers can create/edit training sessions
- [ ] Sessions can be assigned to multiple teams
- [ ] Club managers and team managers can schedule matches (internal and external)
- [ ] Match results can be recorded with detailed events (goals, cards, subs)
- [ ] All events appear in calendar widget on dashboard
- [ ] Team managers only see/edit their own team's sessions/matches
- [ ] Parents receive notifications when events are published
- [ ] Calendar is interactive (click date → event list, click event → details)
- [ ] Draft/publish workflow works for both sessions and matches

## Progress Tracking
- **Database**: ✅ 100% Complete
- **Backend Services**: ✅ 100% Complete
- **Backend API**: ⏳ 0% Complete
- **Frontend Foundation**: ⏳ 0% Complete
- **Season Module**: ⏳ 0% Complete
- **Training Session Module**: ⏳ 0% Complete
- **Match Module**: ⏳ 0% Complete
- **Calendar Integration**: ⏳ 0% Complete
- **Dashboard Updates**: ⏳ 0% Complete
- **Notifications**: ⏳ 0% Complete

**Overall Progress**: ~14% Complete (2/14 major components)

---

Created: 2025-11-22
Last Updated: 2025-11-22
Assigned To: Development Team
Labels: feature, enhancement, backend, frontend, high-priority
