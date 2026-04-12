"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import CategoryTabs from "@/components/CategoryTabs";
import TopicGrid from "@/components/TopicGrid";
import { TopicCategory } from "@/types";
import { TOPICS_BY_CATEGORY } from "@/data/topics";
import { BookOpen, Zap, Trophy } from "lucide-react";

const PROGRESS_KEY = "ssb_prep_progress";

function getStoredProgress(): Record<string, number[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function HomePage() {
  const [category, setCategory] = useState<TopicCategory>("below-average");
  const [progress, setProgress] = useState<Record<string, number[]>>({});

  useEffect(() => {
    setProgress(getStoredProgress());
  }, []);

  const topics = TOPICS_BY_CATEGORY[category];
  const totalTopics = Object.values(TOPICS_BY_CATEGORY).flat().length;
  const startedCount = Object.keys(progress).length;
  const completedCount = Object.values(progress).filter((phases) =>
    phases.includes(4)
  ).length;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero Banner */}
      <div
        className="text-white py-10 px-4"
        style={{
          background: "linear-gradient(135deg, #1a2744 0%, #2d4a8a 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            SSB Lecturette Preparation
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mb-6">
            Complete AI-powered training for all 203 topics · 6-Phase system ·
            Real-time grading
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
              <BookOpen className="w-4 h-4" style={{ color: "#c9a84c" }} />
              <div>
                <div className="text-xs text-slate-300">Total Topics</div>
                <div className="font-bold">{totalTopics}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
              <Zap className="w-4 h-4" style={{ color: "#c9a84c" }} />
              <div>
                <div className="text-xs text-slate-300">Started</div>
                <div className="font-bold">{startedCount}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
              <Trophy className="w-4 h-4" style={{ color: "#c9a84c" }} />
              <div>
                <div className="text-xs text-slate-300">Graded</div>
                <div className="font-bold">{completedCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works strip */}
      <div className="bg-white border-b border-slate-200 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">How it works:</span>
            {[
              "1 Intel Brief",
              "2 Model Script",
              "3 Concept Fire Q&A",
              "4 Live Mock",
              "5 Weak Point Fix",
              "6 Complete",
            ].map((step, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-100 rounded-full">{step}</span>
                {i < 5 && <span className="text-slate-300">→</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="mb-2">
          <h2 className="text-lg font-bold text-slate-800">Choose a Category</h2>
          <p className="text-sm text-slate-500">
            Start with Below Average for foundational topics. Work up to Above
            Average for advanced SSB-level discussions.
          </p>
        </div>

        <div className="mt-4">
          <CategoryTabs selected={category} onSelect={setCategory} />
        </div>

        <div className="mb-4">
          <p className="text-sm text-slate-600 font-medium">
            {topics.length} topics in this category — click any to start
          </p>
        </div>

        <TopicGrid topics={topics} completedByTopic={progress} />
      </main>

      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200">
        SSB Lecturette Prep • AI-Powered by Claude • 203 Topics • 6-Phase System
      </footer>
    </div>
  );
}
