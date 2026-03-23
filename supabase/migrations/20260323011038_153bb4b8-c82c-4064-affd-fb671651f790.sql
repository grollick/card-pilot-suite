UPDATE social_posts SET media_urls = ARRAY['https://picsum.photos/seed/' || id::text || '/800/600']
WHERE media_urls IS NULL;