# Backend Refactoring Plan (Option C)

**Status:** Planned for future ticket
**Created:** 2026-02-03
**Priority:** Medium

## Current State

The backend currently has a monolithic `club/` module containing:
- 8 controllers
- 10 services
- 8 route files

This leads to:
- Service duplication (ClubService vs MemberService)
- Unclear boundaries between domains
- Large files with mixed responsibilities

## Target State

Domain-driven structure where each business domain is self-contained:

```
backend/src/
├── auth/                    ← Authentication & authorization (NO CHANGE)
├── admin/                   ← Platform admin features (NO CHANGE)
├── onboarding/              ← Onboarding flow (NO CHANGE)
├── contact/                 ← Contact form (NO CHANGE)
├── workers/                 ← Background jobs (NO CHANGE)
│
├── club/                    ← Club CRUD only (SIMPLIFIED)
│   ├── controllers/
│   │   └── ClubController.js
│   ├── services/
│   │   └── ClubService.js   ← Only club operations (~10 methods)
│   ├── routes/
│   │   └── clubRoutes.js
│   └── index.js
│
├── member/                  ← Member management (EXTRACTED)
│   ├── controllers/
│   │   └── MemberController.js
│   ├── services/
│   │   └── MemberService.js
│   ├── routes/
│   │   └── memberRoutes.js
│   └── index.js
│
├── team/                    ← Team management (EXTRACTED)
│   ├── controllers/
│   │   └── TeamController.js
│   ├── services/
│   │   └── TeamService.js
│   ├── routes/
│   │   └── teamRoutes.js
│   └── index.js
│
├── personnel/               ← Staff/coach management (EXTRACTED)
│   ├── controllers/
│   │   └── PersonnelController.js
│   ├── services/
│   │   └── PersonnelService.js
│   ├── routes/
│   │   └── personnelRoutes.js
│   └── index.js
│
├── schedule/                ← Seasons, training, matches (EXTRACTED)
│   ├── controllers/
│   │   ├── SeasonController.js
│   │   ├── TrainingSessionController.js
│   │   └── MatchController.js
│   ├── services/
│   │   ├── SeasonService.js
│   │   ├── TrainingSessionService.js
│   │   └── MatchService.js
│   ├── routes/
│   │   ├── seasonRoutes.js
│   │   ├── trainingSessionRoutes.js
│   │   └── matchRoutes.js
│   └── index.js
│
├── billing/                 ← Club billing (EXTRACTED)
│   ├── controllers/
│   │   └── BillingController.js
│   ├── services/
│   │   ├── BillingSettingsService.js
│   │   ├── InvoiceService.js
│   │   └── ScheduledInvoiceJobService.js
│   ├── routes/
│   │   └── billingRoutes.js
│   └── index.js
│
├── parent/                  ← Parent-specific features (COMPLETE)
│   ├── controllers/
│   │   ├── ParentBillingController.js
│   │   ├── ParentChildrenController.js
│   │   ├── ParentInviteController.js
│   │   └── ParentScheduleController.js
│   ├── services/
│   │   ├── ParentBillingService.js
│   │   ├── ParentChildrenService.js
│   │   └── ParentInviteService.js
│   ├── routes/
│   │   └── index.js
│   └── index.js
│
├── payment/                 ← Payment processing (NO CHANGE)
│
└── shared/                  ← Cross-cutting concerns (NEW)
    ├── services/
    │   ├── emailService.js
    │   ├── emailOutboxService.js
    │   └── validationService.js  ← isEmailAvailable() etc.
    └── utils/
        └── postcodeService.js
```

## Migration Steps

### Phase 1: Preparation
1. [ ] Create `shared/` directory structure
2. [ ] Move `emailService.js` and `emailOutboxService.js` to `shared/services/`
3. [ ] Create `ValidationService` with `isEmailAvailable()`
4. [ ] Move `postcodeRoutes.js` to appropriate location

### Phase 2: Extract Member Module
1. [ ] Create `member/` directory structure
2. [ ] Move `MemberController.js` from `club/controllers/`
3. [ ] Move `MemberService.js` from `club/services/`
4. [ ] Move `memberRoutes.js` from `club/routes/`
5. [ ] Update imports in `server.js`
6. [ ] Remove member methods from `ClubService.js`

### Phase 3: Extract Team Module
1. [ ] Create `team/` directory structure
2. [ ] Move `TeamController.js` from `club/controllers/`
3. [ ] Move `TeamService.js` from `club/services/`
4. [ ] Move `teamRoutes.js` from `club/routes/`
5. [ ] Update imports in `server.js`

### Phase 4: Extract Personnel Module
1. [ ] Create `personnel/` directory structure
2. [ ] Move `PersonnelController.js` from `club/controllers/`
3. [ ] Move `PersonnelService.js` from `club/services/`
4. [ ] Move `personnelRoutes.js` from `club/routes/`
5. [ ] Update imports in `server.js`

### Phase 5: Extract Schedule Module
1. [ ] Create `schedule/` directory structure
2. [ ] Move Season, TrainingSession, Match controllers
3. [ ] Move Season, TrainingSession, Match services
4. [ ] Move corresponding route files
5. [ ] Update imports in `server.js`

### Phase 6: Extract Billing Module
1. [ ] Create `billing/` directory structure
2. [ ] Move `BillingController.js` from `club/controllers/`
3. [ ] Move billing services from `club/services/`
4. [ ] Move `billingRoutes.js` from `club/routes/`
5. [ ] Update imports in `server.js`

### Phase 7: Complete Parent Module
1. [ ] Add missing `index.js` files
2. [ ] Export all services from `services/index.js`
3. [ ] Ensure consistent structure

### Phase 8: Cleanup
1. [ ] Remove empty `club/` subdirectories
2. [ ] Update all import paths
3. [ ] Run tests to verify no regressions
4. [ ] Update API documentation

## API Routes (No Breaking Changes)

All routes remain the same - only internal organization changes:

| Route Prefix | Current Module | Target Module |
|--------------|----------------|---------------|
| `/api/clubs/*` | club | club |
| `/api/clubs/*/members` | club | member |
| `/api/teams/*` | club | team |
| `/api/seasons/*` | club | schedule |
| `/api/training-sessions/*` | club | schedule |
| `/api/matches/*` | club | schedule |
| `/api/clubs/*/personnel` | club | personnel |
| `/api/billing/*` | club | billing |
| `/api/parent/*` | parent | parent |

## Frontend Impact

**No frontend changes required** - API routes stay the same.

## Files to Move

### From `club/controllers/` to new modules:
- `MemberController.js` → `member/controllers/`
- `TeamController.js` → `team/controllers/`
- `PersonnelController.js` → `personnel/controllers/`
- `SeasonController.js` → `schedule/controllers/`
- `TrainingSessionController.js` → `schedule/controllers/`
- `MatchController.js` → `schedule/controllers/`
- `BillingController.js` → `billing/controllers/`

### From `club/services/` to new modules:
- `MemberService.js` → `member/services/`
- `TeamService.js` → `team/services/`
- `PersonnelService.js` → `personnel/services/`
- `SeasonService.js` → `schedule/services/`
- `TrainingSessionService.js` → `schedule/services/`
- `MatchService.js` → `schedule/services/`
- `BillingSettingsService.js` → `billing/services/`
- `InvoiceService.js` → `billing/services/`
- `ScheduledInvoiceJobService.js` → `billing/services/`

### From `club/routes/` to new modules:
- `memberRoutes.js` → `member/routes/`
- `teamRoutes.js` → `team/routes/`
- `personnelRoutes.js` → `personnel/routes/`
- `seasonRoutes.js` → `schedule/routes/`
- `trainingSessionRoutes.js` → `schedule/routes/`
- `matchRoutes.js` → `schedule/routes/`
- `billingRoutes.js` → `billing/routes/`

## Estimated Effort

- Phase 1 (Preparation): 1-2 hours
- Phase 2-6 (Extractions): 4-6 hours
- Phase 7-8 (Cleanup): 1-2 hours
- Testing: 2-3 hours

**Total: 8-13 hours**

## Risks

1. **Import path changes** - Need to update all import statements
2. **Circular dependencies** - May need to refactor some service calls
3. **Test updates** - Integration tests may need path updates

## Success Criteria

- [ ] All API endpoints work identically
- [ ] No duplicate code between services
- [ ] Each module is self-contained
- [ ] Clear separation of concerns
- [ ] All tests pass
