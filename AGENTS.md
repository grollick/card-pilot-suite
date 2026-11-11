# Project architecture
- Public plan cards and comparison rows derive from `planDisplay.ts`, with capacity and branding values read from `planLimits.ts`, so marketing and enforcement do not drift.
- Alternate landing URLs redirect to the homepage while preserving search and hash values, so existing referral links retain their context.