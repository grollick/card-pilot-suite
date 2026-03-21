-- Update the card sections and theme with full CardPilot feature showcase content
UPDATE cards SET 
  sections_json = '[
    {"id":"hero","label":"Hero","enabled":true,"content":{"tagline":"The All-in-One Platform for Local Professionals","subtitle":"Digital cards, CRM, estimates, invoicing, booking, marketplace & AI — all from one dashboard."}},
    {"id":"about","label":"About","enabled":true,"content":{"text":"guzzl.pro is a complete business growth platform built for local professionals. From contractors to barbers, realtors to trainers — we give you everything you need to get found, win clients, and grow your business. One card. One dashboard. Zero friction."}},
    {"id":"services","label":"Features","enabled":true,"content":{"items":[
      {"name":"Digital Business Card","description":"Create a stunning, shareable digital card with QR code, NFC tap, and link-in-bio — customized for your trade.","price":"Core"},
      {"name":"Smart CRM & Lead Pipeline","description":"Track every lead from first contact to closed deal. Automated follow-ups, tagging, and activity timeline.","price":"Core"},
      {"name":"Estimates & Invoicing","description":"Build professional estimates with line items, send invoices, accept payments, and track everything.","price":"Core"},
      {"name":"Online Booking System","description":"Let customers book appointments directly from your card. Calendar sync, reminders, and service management.","price":"Core"},
      {"name":"Live Marketplace & Map","description":"Go On Duty and appear on the live map. Customers find you instantly based on location and availability.","price":"Pro"},
      {"name":"AI Business Assistant","description":"Get AI-powered content, business tips, and smart suggestions to optimize your profile and grow faster.","price":"Pro"},
      {"name":"Autopilot Marketing","description":"Automated social posts, email campaigns, review requests, and follow-ups — all running in the background.","price":"Pro"},
      {"name":"Job & Project Management","description":"Manage jobs end-to-end with tasks, materials tracking, before/after photos, and client sign-off.","price":"Pro"}
    ]}},
    {"id":"gallery","label":"Platform Preview","enabled":true,"content":{"images":[
      {"url":"https://yxsnqhuilqdvqrmkjxzf.supabase.co/storage/v1/object/public/card-assets/fdfa8636-c737-46bb-8184-71d5bf44d6f1%2Fgallery%2Ffeature-card-builder.jpg","caption":"Card Builder — Design your perfect digital card"},
      {"url":"https://yxsnqhuilqdvqrmkjxzf.supabase.co/storage/v1/object/public/card-assets/fdfa8636-c737-46bb-8184-71d5bf44d6f1%2Fgallery%2Ffeature-crm-leads.jpg","caption":"CRM & Lead Pipeline — Track every opportunity"},
      {"url":"https://yxsnqhuilqdvqrmkjxzf.supabase.co/storage/v1/object/public/card-assets/fdfa8636-c737-46bb-8184-71d5bf44d6f1%2Fgallery%2Ffeature-estimates.jpg","caption":"Estimates & Invoicing — Professional quoting made easy"},
      {"url":"https://yxsnqhuilqdvqrmkjxzf.supabase.co/storage/v1/object/public/card-assets/fdfa8636-c737-46bb-8184-71d5bf44d6f1%2Fgallery%2Ffeature-marketplace.jpg","caption":"Live Marketplace — Real-time availability map"},
      {"url":"https://yxsnqhuilqdvqrmkjxzf.supabase.co/storage/v1/object/public/card-assets/fdfa8636-c737-46bb-8184-71d5bf44d6f1%2Fgallery%2Ffeature-booking.jpg","caption":"Booking System — Customers book directly from your card"},
      {"url":"https://yxsnqhuilqdvqrmkjxzf.supabase.co/storage/v1/object/public/card-assets/fdfa8636-c737-46bb-8184-71d5bf44d6f1%2Fgallery%2Ffeature-ai-analytics.jpg","caption":"AI Analytics — Smart insights and business growth tips"}
    ]}},
    {"id":"testimonials","label":"Testimonials","enabled":true,"content":{"testimonials":[
      {"name":"Mike Reynolds","text":"guzzl.pro replaced 5 different apps I was paying for. My digital card alone has brought in 12 new clients this month.","role":"General Contractor"},
      {"name":"Marcus Cole","text":"The booking system is a game-changer. Clients book straight from my card — no more back-and-forth texts.","role":"Barber"},
      {"name":"Sarah Chen","text":"The CRM and automated follow-ups have doubled my response rate. I close more deals with less effort.","role":"Realtor"}
    ]}},
    {"id":"booking","label":"Booking","enabled":true},
    {"id":"contact","label":"Contact","enabled":true},
    {"id":"social","label":"Social","enabled":true,"content":{"links":[{"platform":"Website","url":"https://guzzl.pro"}]}}
  ]'::jsonb,
  theme_json = jsonb_set(
    theme_json,
    '{tagline}',
    '"The All-in-One Platform for Local Professionals"'
  ),
  status = 'published'
WHERE user_id = 'fdfa8636-c737-46bb-8184-71d5bf44d6f1';

-- Update services to reflect CardPilot features
DELETE FROM booking_services WHERE user_id = 'fdfa8636-c737-46bb-8184-71d5bf44d6f1';
INSERT INTO booking_services (user_id, name, description, price, active) VALUES
  ('fdfa8636-c737-46bb-8184-71d5bf44d6f1', 'Platform Demo', 'See guzzl.pro in action — full walkthrough of all features tailored to your trade.', 0, true),
  ('fdfa8636-c737-46bb-8184-71d5bf44d6f1', 'Growth Strategy Session', 'One-on-one consultation to plan your digital growth roadmap using guzzl.pro.', 0, true),
  ('fdfa8636-c737-46bb-8184-71d5bf44d6f1', 'Card Setup & Onboarding', 'We will build your professional card, set up your CRM, and get you live in under an hour.', 0, true);

-- Update the about text in theme_json
UPDATE cards SET theme_json = jsonb_set(
  theme_json,
  '{about}',
  '"guzzl.pro is a complete business growth platform built for local professionals. From contractors to barbers, realtors to trainers — we give you everything you need to get found, win clients, and grow your business. Digital card, CRM, estimates, invoicing, booking, marketplace, and AI assistant — all from one dashboard."'
) WHERE user_id = 'fdfa8636-c737-46bb-8184-71d5bf44d6f1';