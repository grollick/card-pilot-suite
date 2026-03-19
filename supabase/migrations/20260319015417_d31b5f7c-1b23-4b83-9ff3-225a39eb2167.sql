DO $$
DECLARE
  v_rec record;
  v_services jsonb;
  v_svc jsonb;
BEGIN
  FOR v_rec IN
    SELECT p.id, pr.name as profession
    FROM profiles p
    JOIN professions pr ON pr.id = p.profession_id
    WHERE p.city = 'Thunder Bay' AND p.marketplace_enabled = true
      AND p.handle LIKE '%-tbay'
  LOOP
    v_services := CASE v_rec.profession
      WHEN 'General Contractor' THEN '[{"n":"Kitchen Renovation","p":15000,"d":60},{"n":"Bathroom Remodel","p":8000,"d":60},{"n":"Basement Finishing","p":20000,"d":90}]'
      WHEN 'Electrician' THEN '[{"n":"Panel Upgrade","p":2500,"d":120},{"n":"EV Charger Install","p":1800,"d":90},{"n":"Electrical Repair","p":150,"d":60}]'
      WHEN 'Plumber' THEN '[{"n":"Drain Cleaning","p":200,"d":60},{"n":"Water Heater Install","p":2000,"d":120},{"n":"Bathroom Roughin","p":3500,"d":180}]'
      WHEN 'Renovation Contractor' THEN '[{"n":"Kitchen Reno","p":12000,"d":60},{"n":"Bathroom Reno","p":7000,"d":60},{"n":"Full Home Reno","p":50000,"d":120}]'
      WHEN 'Roofer' THEN '[{"n":"Shingle Replacement","p":8000,"d":60},{"n":"Roof Repair","p":500,"d":60},{"n":"Eavestrough Install","p":1200,"d":60}]'
      WHEN 'Painter' THEN '[{"n":"Interior Painting","p":3000,"d":60},{"n":"Exterior Painting","p":5000,"d":90},{"n":"Cabinet Refinishing","p":2500,"d":60}]'
      WHEN 'Flooring Installer' THEN '[{"n":"Hardwood Install","p":4000,"d":60},{"n":"Tile Flooring","p":3500,"d":60},{"n":"Vinyl Plank","p":2000,"d":60}]'
      WHEN 'Deck Builder' THEN '[{"n":"Custom Deck Build","p":10000,"d":90},{"n":"Deck Repair","p":1500,"d":60},{"n":"Pergola Build","p":6000,"d":60}]'
      WHEN 'Drywall Installer' THEN '[{"n":"New Drywall Install","p":3000,"d":60},{"n":"Drywall Patching","p":300,"d":30},{"n":"Textured Ceiling","p":1500,"d":60}]'
      WHEN 'HVAC Technician' THEN '[{"n":"Furnace Install","p":5000,"d":120},{"n":"A/C Repair","p":400,"d":60},{"n":"Heat Pump System","p":8000,"d":120}]'
      WHEN 'Landscaper' THEN '[{"n":"Lawn Install","p":3000,"d":60},{"n":"Retaining Wall","p":5000,"d":90},{"n":"Garden Design","p":2000,"d":60}]'
      WHEN 'Concrete Contractor' THEN '[{"n":"Driveway Pour","p":6000,"d":60},{"n":"Sidewalk","p":2000,"d":60},{"n":"Foundation Repair","p":8000,"d":120}]'
      WHEN 'Handyman' THEN '[{"n":"General Repair","p":100,"d":60},{"n":"Door Install","p":250,"d":60},{"n":"Shelving & Storage","p":200,"d":60}]'
      WHEN 'Tile Setter' THEN '[{"n":"Backsplash Install","p":1500,"d":60},{"n":"Bathroom Tile","p":3000,"d":60},{"n":"Floor Tiling","p":4000,"d":90}]'
      WHEN 'Fence Installer' THEN '[{"n":"Privacy Fence","p":4000,"d":60},{"n":"Chain Link Fence","p":2000,"d":60},{"n":"Gate Install","p":800,"d":60}]'
      ELSE '[]'
    END::jsonb;

    FOR v_svc IN SELECT * FROM jsonb_array_elements(v_services)
    LOOP
      INSERT INTO booking_services (id, user_id, name, price, duration_min, active)
      VALUES (gen_random_uuid(), v_rec.id, v_svc->>'n', (v_svc->>'p')::numeric, (v_svc->>'d')::int, true);
    END LOOP;
  END LOOP;
END;
$$;