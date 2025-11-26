# Architecture Decisions - Seasons, Sessions, and Matches

## Data Fetching Strategy

### Decision: No Caching for Real-Time Data

**Problem**: Initial implementation had Zustand stores with 2-5 minute caching for all entities. This causes stale data issues when:
- Multiple users create/update sessions or matches
- Team managers modify events simultaneously
- Dashboard needs to show latest upcoming events

**Solution**: Different strategies for different data types

---

## Implementation

### 1. **Seasons** - Minimal Caching (30 seconds)

**Why**: Seasons are semi-static but can still be updated by club managers

**Zustand Store**: `seasonsStore.ts`
- Cache: 30 seconds
- Use case: Season selector dropdowns
- Benefit: Avoid unnecessary refetches when navigating pages quickly

```typescript
// Usage in components
const { seasons, loadSeasons } = useSeasons();

useEffect(() => {
  loadSeasons(); // Uses 30s cache
}, []);

// Force refresh after create/update
await createSeason(data);
await loadSeasons(true); // forceRefresh = true
```

---

### 2. **Training Sessions** - No Store, Always Fresh

**Why**: Sessions are frequently created/updated and need real-time data

**No Zustand Store** - Components fetch directly:

```typescript
import { fetchTrainingSessions, fetchUpcomingTrainingSessions } from '@/modules/training-session/actions';

function TrainingSessionList() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTrainingSessions();
      setSessions(data);
    } catch (error) {
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    // Render sessions
  );
}
```

**Benefits**:
- Always fresh data from API
- Simpler code (no cache invalidation)
- Real-time updates visible immediately
- Easy to force refresh after mutations

---

### 3. **Matches** - No Store, Always Fresh

**Why**: Match results and events are updated in real-time during matches

**No Zustand Store** - Same pattern as sessions:

```typescript
import { fetchMatches, fetchUpcomingMatches } from '@/modules/match/actions';

function MatchList() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadMatches = async (filters?: MatchFilters) => {
    setIsLoading(true);
    try {
      const data = await fetchMatches(filters);
      setMatches(data);
    } catch (error) {
      toast.error('Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  return (
    // Render matches
  );
}
```

**Benefits**:
- Live match scores always up-to-date
- Match events appear immediately
- No stale data when multiple users log events
- Automatic refresh capability

---

## Comparison Table

| Feature | Seasons | Training Sessions | Matches |
|---------|---------|-------------------|---------|
| **Store** | Zustand | None | None |
| **Caching** | 30 seconds | None | None |
| **Update Frequency** | Low (weeks/months) | Medium (daily) | High (live during match) |
| **Multi-user Editing** | Rare | Common | Very Common |
| **Data Freshness** | Can tolerate 30s lag | Needs fresh data | Needs real-time data |
| **Fetch Strategy** | Store with short cache | Direct component fetch | Direct component fetch |

---

## Pattern Examples

### Dashboard Pattern (Upcoming Events)

```typescript
function ClubManagerDashboard() {
  const { activeSeason, loadActiveSeason } = useSeasons();
  const [upcomingSessions, setUpcomingSessions] = useState<TrainingSession[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);

  useEffect(() => {
    loadActiveSeason();

    // Always fetch fresh upcoming events
    fetchUpcomingTrainingSessions(5).then(setUpcomingSessions);
    fetchUpcomingMatches(5).then(setUpcomingMatches);
  }, []);

  return (
    <div>
      <SeasonSelector season={activeSeason} />
      <UpcomingSessions sessions={upcomingSessions} />
      <UpcomingMatches matches={upcomingMatches} />
    </div>
  );
}
```

### List Page Pattern (with Filters)

```typescript
function TrainingSessionManagement() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [filters, setFilters] = useState<TrainingSessionFilters>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchTrainingSessions(filters);
      setSessions(data);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (newFilters: TrainingSessionFilters) => {
    setFilters(newFilters); // Triggers reload via useEffect
  };

  const handleCreate = async (sessionData: CreateTrainingSessionRequest) => {
    await createTrainingSession(sessionData);
    await loadData(); // Refresh list
    toast.success('Session created!');
  };

  return (
    // Render UI
  );
}
```

### Detail Page Pattern (with Real-time Events)

```typescript
function MatchDetails({ matchId }: { matchId: number }) {
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);

  const loadMatch = async () => {
    const data = await fetchMatch(matchId);
    setMatch(data);
  };

  const loadEvents = async () => {
    const data = await fetchMatchEvents(matchId);
    setEvents(data);
  };

  useEffect(() => {
    loadMatch();
    loadEvents();

    // Optional: Auto-refresh every 30 seconds for live updates
    const interval = setInterval(() => {
      loadEvents();
    }, 30000);

    return () => clearInterval(interval);
  }, [matchId]);

  const handleAddEvent = async (eventData: CreateMatchEventRequest) => {
    await addMatchEvent(matchId, eventData);
    await loadEvents(); // Refresh events list
    toast.success('Event added!');
  };

  return (
    // Render match details and events
  );
}
```

---

## Benefits of This Approach

### 1. **Data Freshness**
- ✅ Always see latest data from API
- ✅ No stale cache issues
- ✅ Real-time updates from other users

### 2. **Simplicity**
- ✅ No complex cache invalidation logic
- ✅ Easier to reason about data flow
- ✅ Less state management code

### 3. **Performance**
- ✅ Only fetch what's needed when needed
- ✅ No unnecessary store subscriptions
- ✅ Component-level loading states

### 4. **Maintainability**
- ✅ Clear data ownership (component owns its data)
- ✅ Easy to add auto-refresh for live data
- ✅ Simple testing (mock fetch functions)

---

## When to Add a Store

**Add Zustand store when**:
- Data is truly global (e.g., current user, app settings)
- Data is static or changes very rarely
- Multiple unrelated components need the same data
- You need to preserve state across route changes

**Don't add store when**:
- Data is page-specific
- Data changes frequently
- Data needs to be fresh (real-time)
- Simple component state suffices

---

## Migration Notes

### Removed Files:
- ❌ `frontend/src/stores/trainingSessionsStore.ts` - Deleted
- ❌ `frontend/src/stores/matchesStore.ts` - Deleted

### Modified Files:
- ✅ `frontend/src/stores/seasonsStore.ts` - Cache reduced from 5 minutes to 30 seconds

### Kept Files:
- ✅ All action files remain (used for direct fetching)
- ✅ All type files remain
- ✅ Backend remains unchanged

---

## Future Considerations

### Option: React Query (If Needed Later)

If we find we need better cache management in the future, React Query would be ideal:

```typescript
import { useQuery } from '@tanstack/react-query';

function useTrainingSessions(filters?: TrainingSessionFilters) {
  return useQuery({
    queryKey: ['training-sessions', filters],
    queryFn: () => fetchTrainingSessions(filters),
    staleTime: 0, // Always fetch fresh
    refetchInterval: 30000, // Auto-refresh every 30s
  });
}
```

Benefits of React Query:
- Built-in loading, error states
- Automatic background refetching
- Smart cache invalidation
- Optimistic updates
- Request deduplication

However, for our current needs, direct fetching is simpler and sufficient.

---

**Decision Date**: 2025-11-22
**Last Reviewed**: 2025-11-22
**Status**: Active
