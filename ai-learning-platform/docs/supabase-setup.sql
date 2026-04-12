-- SSB Lecturette Prep — Supabase Database Setup
-- Run this SQL in: Supabase Dashboard > SQL Editor > New Query

-- Cache table for AI-generated phase content (Phases 1, 2, 3)
-- Content is cached permanently and shared across all users/sessions
CREATE TABLE IF NOT EXISTS topic_cache (
  id BIGSERIAL PRIMARY KEY,
  topic_id VARCHAR(200) NOT NULL,
  phase INTEGER NOT NULL CHECK (phase >= 1 AND phase <= 3),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(topic_id, phase)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_topic_cache_lookup
  ON topic_cache(topic_id, phase);

-- Optional: View to see cache statistics
CREATE OR REPLACE VIEW cache_stats AS
SELECT
  phase,
  COUNT(*) as cached_topics,
  MIN(created_at) as first_cached,
  MAX(updated_at) as last_updated
FROM topic_cache
GROUP BY phase
ORDER BY phase;

-- Verify setup
SELECT 'Setup complete! topic_cache table created.' as status;
