-- Usage analytics for AI cost monitoring
CREATE TABLE IF NOT EXISTS usage_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,          -- 'generate' | 'chat' | 'cache_hit'
  ip TEXT NOT NULL,
  has_email INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  model TEXT DEFAULT '',
  destinations TEXT DEFAULT '',      -- comma-separated slugs
  duration TEXT DEFAULT '',
  budget_level TEXT DEFAULT '',
  cache_hit INTEGER NOT NULL DEFAULT 0,
  query_hash TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_usage_created ON usage_analytics(created_at);
CREATE INDEX idx_usage_type ON usage_analytics(event_type);
