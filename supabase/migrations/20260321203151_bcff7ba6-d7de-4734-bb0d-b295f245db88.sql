UPDATE cards SET theme_json = jsonb_set(
  theme_json::jsonb,
  '{cover_url}',
  '"https://yxsnqhuilqdvqrmkjxzf.supabase.co/storage/v1/object/public/card-assets/covers/guzzl-card-cover.jpg"'::jsonb
)
WHERE user_id = (SELECT id FROM profiles WHERE handle = 'garyrrollick342');