## Social Tool Overhaul

### Problem
The current social tool has 10+ tabs (Streams, Compose, Calendar, Planner, Bulk, Inbox, Campaigns, Feed, Analytics, DFY) that feel disconnected, overwhelming, and slow. Content isn't personalized enough.

### Solution: One-Screen Dashboard

**1. Update edge function to include user's services in AI prompts**
- Fetch services from DB alongside profession/city/company
- Include service names and descriptions in the system prompt so generated content actually promotes what the user offers

**2. Build new `SocialDashboard` component** replacing the current multi-tab layout:
- **Top section**: "Ready to Post" — 3-4 AI-generated post cards personalized to user's profession, location, and services. One-tap to edit or schedule.
- **Middle section**: Quick Compose — inline composer (not a separate tab). Write, pick platform, schedule, done.
- **Bottom section**: "Your Posts" — compact list/grid of recent drafts, scheduled, and published posts with status badges and quick actions.

**3. Simplify SocialScheduler.tsx**
- Remove the sidebar navigation and multi-view switching
- Replace with the single dashboard view
- Keep PostDetailDrawer for viewing post details
- Move Calendar/Analytics/Campaigns to secondary access (dropdown or tabs within sections) rather than primary navigation

**4. Speed improvements**
- Lazy-load AI suggestions with skeleton loading
- Remove unused imports and components from the critical path
- Use `staleTime` on queries to avoid re-fetching

### Files Changed
- `supabase/functions/generate-post-ideas/index.ts` — add services to prompt
- `src/modules/marketing/components/social/SocialDashboard.tsx` — new unified view
- `src/modules/marketing/pages/SocialScheduler.tsx` — simplified to use new dashboard
