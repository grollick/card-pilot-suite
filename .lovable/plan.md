# Batch Q — PayPal subscriptions

## Prerequisite
Payment integration setup must be enabled in an interactive Lovable editor session before payment code can be implemented. That setup is unavailable here. No PayPal secret will be requested and no secrets form will be opened in this batch. No live purchase will be made during verification.

The project currently has no accessible PayPal connector and neither optional PayPal verification credential is configured. Once the payment prerequisite is resolved, missing verification means every new subscription stays pending for manual confirmation, never automatic activation.

## Subscription experience
- Add `/app/plans`, linked from Settings and the account menu, using Batch P's tier helpers and display features.
- Pro uses the $29 founders product while fewer than 25 founders subscriptions are pending or active; otherwise it uses standard $39 Pro. Ultra is $79 and Agency $279, monthly USD.
- Show SmackMedia clearly before the PayPal button and explain PayPal cancellation.
- Load each product's public client ID only when chosen, with separate SDK namespaces. Keep the Agency client ID explicitly provisional until the owner confirms it.
- Preserve the approved subscription number if recording fails and warn against paying again.
- Show pending, active, rejected and cancelled states; refresh plan reads after activation and show pending status on the dashboard.
- Open public pricing and replace beta-only upgrade messages only after safe recording and confirmation are available. Use blue accents and controls at least 44px tall.

## Admin and email
- Add a role-protected Subscriptions section with pending count, account details, copyable subscription numbers, verification status and dates.
- Confirm only pending rows, reject only pending rows, and end only active rows. Ending restores Free; it does not cancel PayPal billing.
- Register the two requested email templates with existing internal authentication and account-email fallback.
- The built-in app-email service does not permit one event to loop over an admin/founder recipient list. Send one operational notification to a designated recipient and expose all pending items in the admin screen; delivery to every administrator requires an explicitly chosen alternative service.

## Technical safeguards
- Keep equivalent app and edge product configs, each product deriving its account key from `KEY_FOR_TIER`; test parity and concrete plan IDs.
- Store user IDs as plain UUIDs, not a foreign key to `auth.users`: Cloud permits that reference only for profiles and user_roles. Use service-controlled lifecycle cleanup if deletion cleanup is needed.
- Create `plan_subscriptions` with explicit grants, RLS owner/admin/founder reads and no authenticated writes. Provide public count-only `founders_spots_left()`.
- Use an atomic service-only database operation for recording and transitions. Serialize founders reservations so concurrent requests cannot exceed 25, enforce unique PayPal IDs and one pending/active subscription per user, and update the row and profile plan in one transaction.
- Authenticate every `plan-subscribe` action and authorize admin actions server-side. Derive plan ID, price and key from the product, never browser-provided values.
- Verify through an enabled PayPal connection when available; otherwise keep pending. Do not add direct provider credential calls that bypass the required connector workflow.
- Reject malformed and duplicate IDs, occupied accounts and sold-out founders requests with the requested messages. Only verified or manually confirmed rows become active.
- Do not modify beta_access. Account plan changes occur only for verified activation, admin confirmation or admin end.

## Validation and report
- Test all four mappings, app/edge parity, cap boundaries and concurrency, refusal paths, atomic activation keys and ending to Free.
- Verify signed-out pricing, signed-in plans, admin permissions, SDK loading with both client IDs, and pending/active/rejected UI on phone and desktop without purchasing.
- Report files, migration, deployed functions, preview checks, unverified live-money flow and deviations above.

## Existing risk from Batch P
Legacy database limits and marketplace AI entitlements still disagree with canonical tiers. This batch must not silently rewrite those allowances; report that risk before opening paid purchases.