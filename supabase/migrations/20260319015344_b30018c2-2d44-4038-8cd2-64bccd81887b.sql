DO $$
DECLARE
  v_uid uuid;
  v_contractors jsonb[] := ARRAY[
    '{"name":"Mike Pelletier","email":"mike.pelletier@demo.cardpilot.app","handle":"mike-pelletier-tbay","profession_id":"89adb1aa-ab45-4838-8b0d-1c80c0bc9138","plan":"pro","company":"Pelletier General Contracting","phone":"(807) 555-0101","bio":"Licensed general contractor with 15+ years experience in residential and commercial projects across Thunder Bay. Kitchen renovations, bathroom remodels, basement finishing.","avg_resp":"22","style":"modern"}'::jsonb,
    '{"name":"Sarah Birch","email":"sarah.birch@demo.cardpilot.app","handle":"sarah-birch-tbay","profession_id":"f800e4c3-a664-4533-8c70-2d2013248dfe","plan":"pro","company":"Birch Electrical Solutions","phone":"(807) 555-0102","bio":"Master electrician serving Thunder Bay. Residential wiring, panel upgrades, EV charger installation, and emergency electrical repairs.","avg_resp":"15","style":"bold"}'::jsonb,
    '{"name":"Dave Kowalski","email":"dave.kowalski@demo.cardpilot.app","handle":"dave-kowalski-tbay","profession_id":"cfc98dff-0468-46fc-9c39-f9a8023ad449","plan":"pro_plus","company":"Kowalski Plumbing & Heating","phone":"(807) 555-0103","bio":"Full-service plumbing contractor. Drain cleaning, water heater installation, bathroom roughins, and 24/7 emergency service.","avg_resp":"18","style":"modern"}'::jsonb,
    '{"name":"Lisa Thunder","email":"lisa.thunder@demo.cardpilot.app","handle":"lisa-thunder-tbay","profession_id":"8d2f0006-a9d6-46b2-828c-17f83c958a0d","plan":"pro","company":"Thunder Renovations","phone":"(807) 555-0104","bio":"Specializing in kitchen and bathroom renovations for Thunder Bay homeowners. Design-build approach with transparent pricing.","avg_resp":"30","style":"elegant"}'::jsonb,
    '{"name":"James Nakogee","email":"james.nakogee@demo.cardpilot.app","handle":"james-nakogee-tbay","profession_id":"af1963ea-97e5-418a-bfe2-d43e9acebb20","plan":"pro","company":"Nakogee Roofing","phone":"(807) 555-0105","bio":"Professional roofing contractor. Shingle replacement, flat roof repairs, eavestrough installation. Free estimates.","avg_resp":"45","style":"bold"}'::jsonb,
    '{"name":"Tony Martino","email":"tony.martino@demo.cardpilot.app","handle":"tony-martino-tbay","profession_id":"7d68abdd-3533-431b-b56c-f2a67fe56f5a","plan":"pro","company":"Martino Painting & Decorating","phone":"(807) 555-0106","bio":"Interior and exterior painting for homes and businesses in Thunder Bay. Cabinet refinishing, deck staining.","avg_resp":"35","style":"modern"}'::jsonb,
    '{"name":"Chris Leblanc","email":"chris.leblanc@demo.cardpilot.app","handle":"chris-leblanc-tbay","profession_id":"343fa2d9-d580-4e14-b96f-2bc21debdf62","plan":"pro_plus","company":"LeBlanc Flooring","phone":"(807) 555-0107","bio":"Hardwood, laminate, tile, and vinyl flooring installation. Free in-home measurements and estimates.","avg_resp":"20","style":"elegant"}'::jsonb,
    '{"name":"Amanda Flett","email":"amanda.flett@demo.cardpilot.app","handle":"amanda-flett-tbay","profession_id":"4926694c-faa1-4238-9f18-b73fade200b8","plan":"pro","company":"Flett Custom Decks","phone":"(807) 555-0108","bio":"Custom deck design and construction. Composite and pressure-treated lumber. Built for Northern Ontario winters.","avg_resp":"40","style":"bold"}'::jsonb,
    '{"name":"Robert Fenton","email":"robert.fenton@demo.cardpilot.app","handle":"robert-fenton-tbay","profession_id":"48001441-c53c-4632-a824-2c3186b1b837","plan":"pro","company":"Fenton Drywall & Taping","phone":"(807) 555-0109","bio":"Professional drywall installation and finishing. New construction, renovation patches, textured ceilings.","avg_resp":"25","style":"modern"}'::jsonb,
    '{"name":"Kim Olsen","email":"kim.olsen@demo.cardpilot.app","handle":"kim-olsen-tbay","profession_id":"83ec4949-6b13-4070-9eaf-414ca700b6d8","plan":"pro_plus","company":"Olsen HVAC Services","phone":"(807) 555-0110","bio":"Furnace installation, A/C repair, and heat pump systems. Licensed gas fitter with emergency availability.","avg_resp":"12","style":"modern"}'::jsonb,
    '{"name":"Brian MacLeod","email":"brian.macleod@demo.cardpilot.app","handle":"brian-macleod-tbay","profession_id":"b427b6bc-87e2-45ae-8984-f79454bbc4d6","plan":"pro","company":"MacLeod Landscaping","phone":"(807) 555-0111","bio":"Complete landscaping services. Lawn installation, retaining walls, interlocking stone, garden design.","avg_resp":"28","style":"bold"}'::jsonb,
    '{"name":"Marie Dubois","email":"marie.dubois@demo.cardpilot.app","handle":"marie-dubois-tbay","profession_id":"d574872f-08bc-4444-a4c3-086366e2a878","plan":"pro","company":"Dubois Concrete Works","phone":"(807) 555-0112","bio":"Residential and commercial concrete. Driveways, sidewalks, foundations, decorative stamped concrete.","avg_resp":"50","style":"modern"}'::jsonb,
    '{"name":"Steve Koski","email":"steve.koski@demo.cardpilot.app","handle":"steve-koski-tbay","profession_id":"5ece9278-608c-456b-afa7-485205542b2a","plan":"pro","company":"Koski Handyman Services","phone":"(807) 555-0113","bio":"No job too small. Drywall patches, plumbing fixes, door installs, shelving, general home repairs.","avg_resp":"15","style":"modern"}'::jsonb,
    '{"name":"Jennifer Fung","email":"jennifer.fung@demo.cardpilot.app","handle":"jennifer-fung-tbay","profession_id":"180a9083-2600-4a95-94b3-6c6edee49e5b","plan":"pro","company":"Fung Tile & Stone","phone":"(807) 555-0114","bio":"Custom tile installation for kitchens, bathrooms, and backsplashes. Precision craftsmanship.","avg_resp":"33","style":"elegant"}'::jsonb,
    '{"name":"Derek Fiddler","email":"derek.fiddler@demo.cardpilot.app","handle":"derek-fiddler-tbay","profession_id":"ca8d4563-5859-4222-ab6b-4406c72edec9","plan":"pro","company":"Fiddler Fence & Gate","phone":"(807) 555-0115","bio":"Wood, vinyl, and chain-link fencing. Privacy fences, gates, and post replacement.","avg_resp":"42","style":"bold"}'::jsonb
  ];
  v_contractor jsonb;
BEGIN
  FOREACH v_contractor IN ARRAY v_contractors LOOP
    v_uid := gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      aud, role, raw_user_meta_data
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000',
      v_contractor->>'email',
      crypt('DemoPass!2026_' || (v_contractor->>'handle'), gen_salt('bf')),
      now(), now(), now(),
      'authenticated', 'authenticated',
      jsonb_build_object('name', v_contractor->>'name')
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      created_at, updated_at, last_sign_in_at
    ) VALUES (
      v_uid, v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_contractor->>'email'),
      'email', v_uid::text,
      now(), now(), now()
    );

    -- Profile is created by handle_new_user trigger, now update it
    UPDATE public.profiles SET
      name = v_contractor->>'name',
      handle = v_contractor->>'handle',
      profession_id = (v_contractor->>'profession_id')::uuid,
      plan = v_contractor->>'plan',
      company = v_contractor->>'company',
      phone = v_contractor->>'phone',
      city = 'Thunder Bay',
      bio = v_contractor->>'bio',
      marketplace_enabled = true,
      service_area = 'Thunder Bay & area',
      available_for_work = true,
      avg_response_minutes = (v_contractor->>'avg_resp')::int,
      onboarding_completed = true,
      style_pack = v_contractor->>'style'
    WHERE id = v_uid;

    -- Create pipeline stages
    INSERT INTO public.pipeline_stages (id, user_id, name, sort_order)
    VALUES
      (gen_random_uuid(), v_uid, 'New Lead', 0),
      (gen_random_uuid(), v_uid, 'Estimate Sent', 1),
      (gen_random_uuid(), v_uid, 'Estimate Approved', 2),
      (gen_random_uuid(), v_uid, 'Job Scheduled', 3),
      (gen_random_uuid(), v_uid, 'Completed', 4),
      (gen_random_uuid(), v_uid, 'Paid', 5);

  END LOOP;
END;
$$;