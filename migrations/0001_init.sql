-- Cached itineraries
CREATE TABLE IF NOT EXISTS itineraries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_hash TEXT NOT NULL UNIQUE,
  destinations TEXT NOT NULL,
  duration TEXT NOT NULL,
  budget_level TEXT NOT NULL,
  travel_style TEXT DEFAULT '',
  month TEXT DEFAULT '',
  request_json TEXT NOT NULL,
  response_json TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'ai',
  quality TEXT NOT NULL DEFAULT 'auto',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_hit_at TEXT
);

CREATE INDEX idx_query_hash ON itineraries(query_hash);
CREATE INDEX idx_dest_dur_budget ON itineraries(destinations, duration, budget_level);

-- Rate limiting (only counts Claude API calls, not cache hits)
CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  has_email INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_rate_ip ON rate_limits(ip, created_at);

-- Email subscribers
CREATE TABLE IF NOT EXISTS email_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  destinations_interested TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
