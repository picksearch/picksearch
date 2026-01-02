-- External API Tables

-- 1. Partners Table
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL, -- X-Partner-Key
  secret_key_hash TEXT NOT NULL, -- Stored hash of X-Partner-Secret
  webhook_url TEXT, -- URL to send events to
  webhook_secret TEXT, -- Secret for signing webhook payloads
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- 2. User User Links (Map External User to Picksearch User)
CREATE TABLE IF NOT EXISTS user_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  external_user_id TEXT NOT NULL, -- Partner's User ID
  picksearch_user_id UUID,        -- Mapped Supabase User ID (can be null initially or created)
  user_token TEXT UNIQUE NOT NULL, -- X-User-Token (generated)
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id, external_user_id)
);

-- Indexes for performance
CREATE INDEX idx_partners_api_key ON partners(api_key);
CREATE INDEX idx_user_links_token ON user_links(user_token);
CREATE INDEX idx_user_links_external ON user_links(partner_id, external_user_id);

-- RLS Policies (Optional for these system tables if accessed only via Service Role Key)
-- But good practice to enable RLS and restrict public access
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_links ENABLE ROW LEVEL SECURITY;

-- Only Service Role can manage these
CREATE POLICY "Service Role manages partners" ON partners
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service Role manages user_links" ON user_links
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Initial Demo Partner (For testing)
-- api_key: pickering_partner_test
-- secret_key: secret_12345 (Ideally this should be hashed in real app)
-- For MVP, we'll store specific keys directly or handle hashing in the API logic.
-- Let's assume we store them as-is for the MVP connectivity test.
INSERT INTO partners (name, api_key, secret_key_hash)
VALUES ('Picketing Test Partner', 'pickering_partner_test', 'secret_12345')
ON CONFLICT (api_key) DO NOTHING;
