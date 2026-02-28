CREATE TABLE IF NOT EXISTS maps_page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page TEXT NOT NULL,
  ip TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_maps_page_views_created ON maps_page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_maps_page_views_page ON maps_page_views(page);
