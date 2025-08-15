-- Migration: votes/reports cached counters + constraints
-- Date: 2025-08-10

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS upvotes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS downvotes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reports INT NOT NULL DEFAULT 0;

ALTER TABLE votes
  ADD UNIQUE KEY uq_vote (deal_id, user_id);

ALTER TABLE abuse_reports
  ADD UNIQUE KEY uq_report (deal_id, reported_by);

UPDATE deals d
LEFT JOIN (
  SELECT deal_id, SUM(vote_type='up') AS upc, SUM(vote_type='down') AS dnc
  FROM votes GROUP BY deal_id
) v ON v.deal_id = d.id
LEFT JOIN (
  SELECT deal_id, COUNT(*) AS rc
  FROM abuse_reports GROUP BY deal_id
) r ON r.deal_id = d.id
SET d.upvotes = COALESCE(v.upc,0),
    d.downvotes = COALESCE(v.dnc,0),
    d.reports = COALESCE(r.rc,0);
