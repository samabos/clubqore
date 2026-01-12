# Dashboard Module

The Dashboard module provides role-based dashboard views and components for the ClubQore application.

## Structure

```
dashboard/
├── actions/              # Data fetching and business logic
│   └── parent-dashboard-actions.ts
├── components/           # Reusable UI components
│   └── EventCard.tsx
├── pages/                # Dashboard page components (all role-based dashboards)
│   ├── Dashboard.tsx             # General/fallback dashboard
│   ├── AdminDashboard.tsx        # Admin role dashboard
│   ├── SuperAdminDashboard.tsx   # Super admin dashboard
│   ├── MemberDashboard.tsx       # Member role dashboard
│   └── ParentDashboard.tsx       # Parent role dashboard
├── types/                # TypeScript type definitions
│   └── index.ts
├── utils/                # Utility functions
│   └── dashboard-utils.ts
└── index.ts              # Module exports
```

## Components

### EventCard
Reusable component for displaying training sessions and matches.

**Features:**
- Displays training sessions and matches
- Shows child name for parent dashboards
- Home/Away match indicators
- Smart date labels (Today, Tomorrow, formatted dates)
- Visual distinction between event types

**Usage:**
```tsx
import { EventCard } from '@/modules/dashboard';

<EventCard event={event} variant="default" />
```

## Pages

### Dashboard
General fallback dashboard view for authenticated users.

### AdminDashboard
Dashboard view for admin users with administrative controls and oversight.

### SuperAdminDashboard
Dashboard view for super admin users with system-wide controls.

### MemberDashboard
Dashboard view for member users showing their personal information and activities.

### ParentDashboard
Dashboard view for parent users showing:
- Children overview
- Upcoming events (training sessions and matches)
- Recent invoices
- Dashboard statistics

## Actions

### fetchParentDashboardData()
Fetches all data needed for the parent dashboard in a single optimized call.

**Returns:**
- Children list
- Invoices
- Training sessions
- Matches

### fetchChildDashboardData(childId)
Fetches dashboard data for a specific child.

## Types

### DashboardEvent
Unified event type combining training sessions and matches for display.

### ParentDashboardData
Complete data structure for parent dashboard.

### DashboardStats
Dashboard statistics and metrics.

## Utils

### combineAndSortEvents(trainingSessions, matches)
Combines training sessions and matches into a sorted event list.

### getInvoiceStatusVariant(status)
Returns the appropriate badge variant for invoice status.

## Architecture Principles

1. **Separation of Concerns**: Business logic in actions, UI in components
2. **Reusability**: Components designed to be used across different views
3. **Type Safety**: Comprehensive TypeScript types for all data structures
4. **Clean Imports**: Module-level exports via index.ts
5. **Testability**: Pure functions and separated concerns enable easy testing

## Usage

Import dashboards from the module:

```tsx
import {
  Dashboard,
  AdminDashboard,
  SuperAdminDashboard,
  MemberDashboard,
  ParentDashboard,
} from '@/modules/dashboard';
```

## Future Enhancements

- Club manager dashboard (currently in club module)
- Dashboard widgets/cards system
- Customizable layouts per role
- Real-time updates and notifications
- Dashboard analytics and insights
- Role-specific action buttons and quick links
