# Project architecture
- Public plan cards and comparison rows derive from `planDisplay.ts`, with capacity and branding values read from `planLimits.ts`, so marketing and enforcement do not drift.
- Alternate landing URLs redirect to the homepage while preserving search and hash values, so existing referral links retain their context.
- Resolve stored plan keys through the app and edge `planTiers.ts` helpers; keep both helpers equivalent with parity tests, so aliases never change entitlements or displayed identity.
- Adapt historical business-subscription identities at the read boundary without changing stored keys or entitlements, because that catalog predates the account-plan mapping and reverses its paid keys.