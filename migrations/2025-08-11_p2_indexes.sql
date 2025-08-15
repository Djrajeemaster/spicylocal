-- P2: Performance indexes and support tables
-- Run this once on your DB.

-- Deals common filters
CREATE INDEX IF NOT EXISTS idx_deals_status_created ON deals (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_status_views   ON deals (status, views DESC);
CREATE INDEX IF NOT EXISTS idx_deals_user_created   ON deals (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_category       ON deals (category);

-- Votes/Feedback/Reports uniqueness & lookups
ALTER TABLE votes ADD UNIQUE KEY uq_votes_user_deal (user_id, deal_id);
ALTER TABLE feedback ADD UNIQUE KEY uq_feedback_user_deal (user_id, deal_id);
ALTER TABLE abuse_reports ADD UNIQUE KEY uq_report_user_deal (reported_by, deal_id);

-- Optional: fulltext for search if supported
-- ALTER TABLE deals ADD FULLTEXT ft_title_desc (title, description);

-- Simple session-based rate limiter (DB fallback table, optional)
CREATE TABLE IF NOT EXISTS rate_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT 0,
  ip VARCHAR(64) DEFAULT '',
  action VARCHAR(64) NOT NULL,
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rate_action_ts (action, ts),
  INDEX idx_rate_user_ts (user_id, ts),
  INDEX idx_rate_ip_ts (ip, ts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
