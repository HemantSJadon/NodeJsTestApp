import { createClient } from "@supabase/supabase-js";
import { CachedPhaseContent } from "@/types";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  return createClient(url, key);
}

export async function getCachedContent(
  topicId: string,
  phase: number
): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("topic_cache")
      .select("content")
      .eq("topic_id", topicId)
      .eq("phase", phase)
      .single();

    if (error || !data) return null;
    return data.content as string;
  } catch {
    return null;
  }
}

export async function setCachedContent(
  topicId: string,
  phase: number,
  content: string
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.from("topic_cache").upsert(
      {
        topic_id: topicId,
        phase,
        content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "topic_id,phase" }
    );
  } catch (error) {
    // Cache write failures are non-fatal — log but don't throw
    console.error("Cache write failed:", error);
  }
}

export async function getAllCachedTopics(): Promise<
  Array<{ topic_id: string; phase: number }>
> {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("topic_cache")
      .select("topic_id, phase");
    return data || [];
  } catch {
    return [];
  }
}

export async function deleteCachedContent(
  topicId: string,
  phase: number
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase
      .from("topic_cache")
      .delete()
      .eq("topic_id", topicId)
      .eq("phase", phase);
  } catch (error) {
    console.error("Cache delete failed:", error);
  }
}

// SQL to create the cache table — run this in Supabase SQL editor
export const CACHE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS topic_cache (
  id BIGSERIAL PRIMARY KEY,
  topic_id VARCHAR(200) NOT NULL,
  phase INTEGER NOT NULL CHECK (phase >= 1 AND phase <= 5),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(topic_id, phase)
);

CREATE INDEX IF NOT EXISTS idx_topic_cache_lookup
  ON topic_cache(topic_id, phase);
`;
