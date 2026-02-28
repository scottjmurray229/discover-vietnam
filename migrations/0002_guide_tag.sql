-- Add guide_tag column to email_subscribers (subscribe.ts already inserts it)
ALTER TABLE email_subscribers ADD COLUMN guide_tag TEXT DEFAULT '';
