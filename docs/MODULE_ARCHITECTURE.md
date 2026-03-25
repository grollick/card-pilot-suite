# Guzzl Module Architecture — Phase 2

> Source-of-truth rules, module ownership, and stabilization notes.  
> Last updated: 2026-03-25

---

## 1. Core Modules

| Module | Scope | Key Directories |
|--------|-------|-----------------|
| **Identity** | Auth, profile, workspace, plan | `auth/`, `settings/`, `onboarding/` |
| **Presence** | On-duty status, availability, map | `dashboard/duty/`, `public/OnDutyMapPage` |
| **Demand** | Leads, contacts, pipeline, estimates | `crm/`, `estimates/`, `jobs/` |
| **Operations** | Bookings, invoices, expenses, recurring | `booking/`, `invoices/`, `expenses/` |
| **Growth** | Card, marketing, social, analytics, marketplace | `card/`, `marketing/`, `analytics/`, `marketplace/` |
| **Control** | Admin, team, automation, feedback | `admin/`, `team/`, `automation/`, `feedback/` |

---

## 2. Source-of-Truth Rules

| Data | Single Source | Table/Field | Notes |
|------|-------------|-------------|-------|
| **Is on duty** | `estimate_duty_status.is_on_duty` | Query key: `estimate-duty-status` | All widgets must use this query key — no separate fetches |
| **User plan** | `get_effective_plan(user_id)` RPC | Includes beta access override | Never read `profiles.plan` directly |
| **Marketplace visibility** | `profiles.marketplace_enabled` | Via `get_public_profiles()` RPC | Map hook uses RPC, not raw table |
| **Lead/contact** | `leads` table, scoped by `user_id` | Query key: `contacts` | Always filter by auth user |
| **Pipeline stages** | `pipeline_stages`, scoped by `user_id` | Query key: `pipeline-stages` | Scoped per user |
| **Card data** | `cards` table + `cards.theme_json` | Query key: `cards` | Single card per user (latest) |
| **Public card** | `usePublicCard(handle)` | Query key: `public-card` | Parallel fetch: profile + card + style + duty + analytics |
| **Workspace** | `organizations` + `organization_members` | RLS-enforced | Owner visible immediately via `created_by` |

---

## 3. Priority Systems — Module Rules

### 3.1 On Duty (Presence)

- **Source data**: `estimate_duty_status` table
- **User actions**: Toggle on/off, set max leads, set radius, set availability window
- **Success state**: Green glow, "Live" badge, leads progress bar
- **Empty state**: "Toggle on to receive estimate requests"
- **Failure state**: Toast "Failed to update duty status"
- **Permissions**: Pro plan and above

### 3.2 Lead Flow (Demand)

- **Source data**: `leads` table, `pipeline_stages`, `contact_activities`
- **User actions**: View contacts, move through pipeline, add tags, log activities
- **Success state**: Contact list with stages, filterable, sortable
- **Empty state**: "No contacts yet" with CTA to share card
- **Failure state**: Error boundary with retry
- **Permissions**: All plans (starter limited to 100 contacts)

### 3.3 Card Publishing (Growth)

- **Source data**: `cards.sections_json`, `cards.theme_json`, `cards.status`
- **User actions**: Toggle sections, edit content, change theme, publish/unpublish
- **Success state**: "Card published!" toast with privacy note
- **Empty state**: Default sections loaded, draft status
- **Failure state**: "Failed to save" toast, globalSaveState shows error
- **Permissions**: All plans

### 3.4 Onboarding (Identity)

- **Source data**: `profiles`, `cards`, `professions`
- **User actions**: Set name, choose profession, generate card, publish
- **Success state**: "You Are Live" animated reveal
- **Empty state**: Welcome screen with profession picker
- **Failure state**: Graceful fallback to manual setup
- **Permissions**: New users

### 3.5 Founder Dashboard (Control)

- **Source data**: Admin stats RPC, multiple aggregation queries
- **User actions**: View KPIs, manage users, view growth
- **Success state**: Dashboard with live metrics
- **Empty state**: Zero state for each KPI tile
- **Failure state**: Skeleton loaders, "Unable to load" per widget
- **Permissions**: `founder` role only

---

## 4. Query Key Registry

Canonical query keys — all components must use these exact keys to share cache:

```
estimate-duty-status     → On-duty toggle state
estimate-duty-analytics  → 30-day duty performance
on-duty-map             → Map professionals list
contacts                → User's leads/contacts
pipeline-stages         → User's pipeline stages
tags                    → User's tags
cards                   → User's card data
public-card             → Public card by handle
profile                 → Current user profile
dashboard-stats         → Dashboard KPIs
```

---

## 5. Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `useCardBuilderState` is 505 lines | Medium | Works but hard to maintain — split identity/theme/sections into sub-hooks when adding features |
| `estimate_matches` / `estimate_requests` tables use `as any` casts | Low | Tables exist but aren't in generated types yet — will auto-resolve on next schema sync |
| Map depends on WebGL + tile servers | Medium | Auto-fallback to list view implemented |
| Realtime channel for duty uses Postgres changes | Low | Simplified to single `*` event listener, fallback is 30s polling via refetchInterval |
