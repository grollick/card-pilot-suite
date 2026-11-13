# Landing page and plan cleanup
- [x] Redirect alternate landing links to the homepage with query strings preserved; remove the alternate admin entry.
- [x] Fix the homepage headline and beta wording without changing colours.
- [x] Share one audited plan display between homepage pricing, pricing cards and comparison table.
- [x] Remove leftover upgrade claims and verify public pages, limits and beta plan availability.

# Batch P
- [x] Align tier helpers, limits, labels and four pricing cards without changing account values.
- [x] Audit server plan storage and enforcement; fix safe mismatches and report risks (legacy subscription quotas and database limit functions left unchanged).
- [x] Test aliases and verify pricing on phone, tablet and desktop; report changes.

# Batch Q
- [ ] Enable the payment prerequisite in an interactive Lovable editor session; unavailable in this session. No secrets request.
- [ ] Add atomic, service-only subscription recording and admin transitions with founders cap and read-only customer access.
- [ ] Add product configuration, PayPal button, Plans page, pending strip and admin Subscriptions section.
- [ ] Open paid pricing and upgrade links only after subscription safeguards are ready.
- [ ] Test rules, deploy functions and verify without making a live purchase; report remaining limitations.
- [ ] After Batch Q exists, use the confirmed shared client ID for all four products, remove the Agency provisional note, update affected tests and redeploy importing functions; blocked by unfinished Batch Q and absent configs.

# Monitoring fixes
- [x] Verify and fix card design and pending-save isolation when switching cards; two regression tests reproduce the old failure and pass after the fix.
- [x] Verify and fix explicit setup-wizard reruns for completed accounts; three regression tests and signed-in Settings → Continue → profession selection pass.
- [x] Check signed-in editor and full test suite; resolve confirmed findings. Live second-card switching is blocked by the existing cards_user_id_unique constraint; no schema change was made.