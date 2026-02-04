# Frontend API Tracking

**Created:** 2026-02-03
**Purpose:** Track all frontend files that consume backend API endpoints for the Option C backend refactoring.

> **Important:** The backend refactoring (Option C) changes only internal organization. All API routes remain unchanged, so **no frontend modifications are required**. This document serves as a reference for future maintenance and tracking.

## API Endpoint to Frontend File Mapping

### Auth Module (No Change)
| Endpoint | Frontend Files |
|----------|---------------|
| `/auth/login` | `api/auth.ts`, `services/authService.ts` |
| `/auth/register` | `api/auth.ts`, `services/authService.ts` |
| `/auth/me` | `api/auth.ts`, `services/authService.ts` |
| `/auth/logout` | `api/auth.ts`, `services/authService.ts` |
| `/auth/refresh` | `services/authService.ts` |
| `/auth/forgot-password` | `api/auth.ts`, `services/authService.ts` |
| `/auth/reset-password` | `api/auth.ts`, `services/authService.ts` |
| `/auth/verify-email` | `api/auth.ts`, `api/emailVerification.ts` |
| `/auth/resend-verification` | `api/auth.ts`, `services/authService.ts` |
| `/auth/is-email-available/:email` | `api/auth.ts`, `api/emailVerification.ts` |
| `/auth/google/callback` | `api/auth.ts` |
| `/auth/resources` | `modules/admin/actions/permission-actions.ts` |
| `/auth/roles` | `api/auth.ts`, `modules/admin/actions/permission-actions.ts` |
| `/auth/permissions/matrix` | `modules/admin/actions/permission-actions.ts` |
| `/auth/roles/:id/permissions` | `modules/admin/actions/permission-actions.ts` |

### Club Module (Simplified after refactoring)
| Endpoint | Frontend Files | Target Backend Module |
|----------|---------------|----------------------|
| `/clubs` | `modules/club/actions/club-actions.ts` | `club/` |
| `/clubs/my-club` | `modules/club/actions/club-actions.ts` | `club/` |
| `/clubs/:clubId` | `modules/club/actions/club-actions.ts` | `club/` |
| `/clubs/:clubId/logo` | `modules/club/actions/club-actions.ts` | `club/` |
| `/clubs/stats` | `modules/club/actions/club-actions.ts` | `club/` |
| `/clubs/alerts` | `modules/club/actions/club-actions.ts` | `club/` |
| `/clubs/recent-members` | `modules/club/actions/club-actions.ts` | `club/` |
| `/clubs/upcoming-sessions` | `modules/club/actions/club-actions.ts` | `club/` |

### Member Module (Extracted)
| Endpoint | Frontend Files | Target Backend Module |
|----------|---------------|----------------------|
| `/clubs/my-club/members` | `modules/member/actions/member-actions.ts` | `member/` |
| `/clubs/my-club/members/:memberId` | `modules/member/actions/member-actions.ts` | `member/` |
| `/clubs/my-club/members/bulk-delete` | `modules/member/actions/member-actions.ts` | `member/` |
| `/clubs/my-club/members/export` | `modules/member/actions/member-actions.ts` | `member/` |
| `/clubs/my-club/members/:memberId/status` | `modules/member/actions/member-actions.ts` | `member/` |

### Team Module (Extracted)
| Endpoint | Frontend Files | Target Backend Module |
|----------|---------------|----------------------|
| `/teams` | `modules/team/actions/team-actions.ts` | `team/` |
| `/teams/:teamId` | `modules/team/actions/team-actions.ts` | `team/` |
| `/teams/:teamId/managers` | `modules/team/actions/team-actions.ts` | `team/` |
| `/teams/:teamId/managers/:userId` | `modules/team/actions/team-actions.ts` | `team/` |
| `/teams/:teamId/members` | `modules/team/actions/team-actions.ts` | `team/` |
| `/teams/:teamId/members/:memberId` | `modules/team/actions/team-actions.ts` | `team/` |
| `/teams/:teamId/tier` | `modules/team/actions/team-actions.ts` | `team/` |
| `/teams/assigned-children` | `modules/team/actions/team-actions.ts` | `team/` |

### Personnel Module (Extracted)
| Endpoint | Frontend Files | Target Backend Module |
|----------|---------------|----------------------|
| `/clubs/:clubId/personnel` | `modules/personnel/actions/personnel-actions.ts` | `personnel/` |
| `/clubs/personnel/:userRoleId` | `modules/personnel/actions/personnel-actions.ts` | `personnel/` |
| `/clubs/:clubId/personnel/team-managers` | `modules/team/actions/team-actions.ts` | `personnel/` |

### Schedule Module (Extracted - Seasons, Training, Matches)
| Endpoint | Frontend Files | Target Backend Module |
|----------|---------------|----------------------|
| `/seasons` | `modules/season/actions/season-actions.ts` | `schedule/` |
| `/seasons/active` | `modules/season/actions/season-actions.ts` | `schedule/` |
| `/seasons/:seasonId` | `modules/season/actions/season-actions.ts` | `schedule/` |
| `/seasons/:seasonId/activate` | `modules/season/actions/season-actions.ts` | `schedule/` |
| `/training-sessions` | `modules/training-session/actions/training-session-actions.ts` | `schedule/` |
| `/training-sessions/upcoming` | `modules/training-session/actions/training-session-actions.ts` | `schedule/` |
| `/training-sessions/:sessionId` | `modules/training-session/actions/training-session-actions.ts` | `schedule/` |
| `/training-sessions/:sessionId/publish` | `modules/training-session/actions/training-session-actions.ts` | `schedule/` |
| `/training-sessions/:sessionId/cancel` | `modules/training-session/actions/training-session-actions.ts` | `schedule/` |
| `/matches` | `modules/match/actions/match-actions.ts` | `schedule/` |
| `/matches/upcoming` | `modules/match/actions/match-actions.ts` | `schedule/` |
| `/matches/:matchId` | `modules/match/actions/match-actions.ts` | `schedule/` |
| `/matches/:matchId/publish` | `modules/match/actions/match-actions.ts` | `schedule/` |
| `/matches/:matchId/result` | `modules/match/actions/match-actions.ts` | `schedule/` |
| `/matches/:matchId/events` | `modules/match/actions/match-actions.ts` | `schedule/` |

### Billing Module (Extracted)
| Endpoint | Frontend Files | Target Backend Module |
|----------|---------------|----------------------|
| `/billing/invoices` | `modules/billing/actions/billing-actions.ts` | `billing/` |
| `/billing/invoices/:invoiceId` | `modules/billing/actions/billing-actions.ts` | `billing/` |
| `/billing/invoices/:invoiceId/publish` | `modules/billing/actions/billing-actions.ts` | `billing/` |
| `/billing/invoices/:invoiceId/paid` | `modules/billing/actions/billing-actions.ts` | `billing/` |
| `/billing/invoices/:invoiceId/cancel` | `modules/billing/actions/billing-actions.ts` | `billing/` |
| `/billing/invoices/bulk/seasonal` | `modules/billing/actions/billing-actions.ts` | `billing/` |
| `/billing/users/:userId/invoices` | `modules/billing/actions/billing-actions.ts` | `billing/` |
| `/billing/summary` | `modules/billing/actions/billing-actions.ts` | `billing/` |
| `/billing/settings` | `modules/billing/actions/billing-actions.ts` | `billing/` |
| `/billing/scheduled-jobs` | `modules/billing/actions/billing-actions.ts` | `billing/` |

### Parent Module (No Change)
| Endpoint | Frontend Files |
|----------|---------------|
| `/parent/schedule` | `api/parent.ts` |
| `/parent/children/:childId/schedule` | `api/parent.ts` |
| `/parent/billing/invoices` | `modules/billing/actions/billing-actions.ts` |
| `/parent/billing/invoices/:invoiceId` | `modules/billing/actions/billing-actions.ts` |
| `/parent/billing/children/:childUserId/invoices` | `modules/billing/actions/billing-actions.ts` |

### Onboarding Module (No Change)
| Endpoint | Frontend Files |
|----------|---------------|
| `/onboarding/complete` | `api/onboarding.ts` |
| `/onboarding/roles` | `api/onboarding.ts` |
| `/onboarding/status` | `api/onboarding.ts` |
| `/onboarding/progress` | `api/onboarding.ts` |
| `/onboarding/primary-role` | `api/onboarding.ts` |
| `/onboarding/completion` | `api/onboarding.ts` |
| `/onboarding/completion/:userId` | `api/onboarding.ts` |
| `/onboarding/completion/update` | `api/onboarding.ts` |

### Profile Module (No Change)
| Endpoint | Frontend Files |
|----------|---------------|
| `/profile/` | `api/profile.ts` |
| `/profile/:userId` | `api/profile.ts` |
| `/profile/preferences` | `api/profile.ts` |
| `/profile/avatar` | `api/profile.ts` |
| `/profile/children` | `api/profile.ts` |

### Admin Module (No Change)
| Endpoint | Frontend Files |
|----------|---------------|
| `/api/admin/system-config` | `api/systemConfig.ts` |
| `/api/admin/system-config/:id` | `api/systemConfig.ts` |
| `/api/admin/system-config/key/:key` | `api/systemConfig.ts` |
| `/api/admin/system-config/cache/clear` | `api/systemConfig.ts` |
| `/api/admin/system-config/cache/stats` | `api/systemConfig.ts` |

### Other Endpoints
| Endpoint | Frontend Files |
|----------|---------------|
| `/health` | `api/health.ts` |
| `/accounts/generate` | `api/accounts.ts` |
| `/accounts/:accountNumber` | `api/accounts.ts` |
| `/accounts/search` | `api/accounts.ts` |
| `/api/parent-invites` | `modules/member/actions/parent-invite-actions.ts` |
| `/api/clubs/:clubId/parent-invites` | `modules/member/actions/parent-invite-actions.ts` |

---

## Frontend File Summary

### API Layer (`/frontend/src/api/`)
| File | Endpoints Count | Notes |
|------|----------------|-------|
| `auth.ts` | 14 | Core authentication |
| `profile.ts` | 6 | User profile management |
| `onboarding.ts` | 8 | Onboarding flow |
| `parent.ts` | 2 | Parent schedule endpoints |
| `accounts.ts` | 3 | Account management |
| `emailVerification.ts` | 3 | Email verification |
| `systemConfig.ts` | 7 | Admin system config |
| `health.ts` | 1 | Health check |

### Module Actions (`/frontend/src/modules/*/actions/`)
| File | Endpoints Count | Backend Module |
|------|----------------|----------------|
| `club/actions/club-actions.ts` | 8 | club |
| `member/actions/member-actions.ts` | 8 | member |
| `team/actions/team-actions.ts` | 14 | team |
| `personnel/actions/personnel-actions.ts` | 4 | personnel |
| `season/actions/season-actions.ts` | 7 | schedule |
| `training-session/actions/training-session-actions.ts` | 8 | schedule |
| `match/actions/match-actions.ts` | 11 | schedule |
| `billing/actions/billing-actions.ts` | 16 | billing |
| `admin/actions/permission-actions.ts` | 10 | auth |

### Services (`/frontend/src/services/`)
| File | Endpoints Count | Notes |
|------|----------------|-------|
| `authService.ts` | 9 | Auth operations |

---

## Backend Module Migration Reference

| Current Location | Target Location | Frontend Impact |
|-----------------|-----------------|-----------------|
| `club/controllers/MemberController.js` | `member/controllers/` | None |
| `club/controllers/TeamController.js` | `team/controllers/` | None |
| `club/controllers/PersonnelController.js` | `personnel/controllers/` | None |
| `club/controllers/SeasonController.js` | `schedule/controllers/` | None |
| `club/controllers/TrainingSessionController.js` | `schedule/controllers/` | None |
| `club/controllers/MatchController.js` | `schedule/controllers/` | None |
| `club/controllers/BillingController.js` | `billing/controllers/` | None |
| `club/services/MemberService.js` | `member/services/` | None |
| `club/services/TeamService.js` | `team/services/` | None |
| `club/services/PersonnelService.js` | `personnel/services/` | None |
| `club/services/SeasonService.js` | `schedule/services/` | None |
| `club/services/TrainingSessionService.js` | `schedule/services/` | None |
| `club/services/MatchService.js` | `schedule/services/` | None |
| `club/services/BillingSettingsService.js` | `billing/services/` | None |
| `club/services/InvoiceService.js` | `billing/services/` | None |
| `club/services/ScheduledInvoiceJobService.js` | `billing/services/` | None |

---

## Verification Checklist

After backend refactoring, verify these frontend flows still work:

- [ ] Authentication (login, register, logout)
- [ ] Club management (CRUD operations)
- [ ] Member management (list, add, update, delete)
- [ ] Team management (CRUD, assign members/managers)
- [ ] Personnel management (list, add, update)
- [ ] Season management (CRUD, activate)
- [ ] Training session management (CRUD, publish, cancel)
- [ ] Match management (CRUD, results, events)
- [ ] Billing (invoices, settings, scheduled jobs)
- [ ] Parent portal (schedule, billing)
- [ ] Admin panel (permissions, system config)
- [ ] Onboarding flow
- [ ] Profile management

---

*This document is auto-generated for Option C backend refactoring tracking.*
