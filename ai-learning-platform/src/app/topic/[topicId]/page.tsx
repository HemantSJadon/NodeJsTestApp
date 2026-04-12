"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import PhaseNav from "@/components/PhaseNav";
import MarkdownContent from "@/components/MarkdownContent";
import Phase3ConceptFire from "@/components/Phase3ConceptFire";
import Phase4LiveMock from "@/components/Phase4LiveMock";
import Phase6Complete from "@/components/Phase6Complete";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import TopicNavigator from "@/components/TopicNavigator";
import { PhaseNumber, GradingResult, ConceptFireQA } from "@/types";
import { getTopicById, getAdjacentTopics, CATEGORY_LABELS } from "@/data/topics";
import { ArrowLeft, RefreshCw, Database, Zap } from "lucide-react";

const PROGRESS_KEY = "ssb_prep_progress";
const PHASE_CACHE_KEY = "ssb_phase_cache";

function getLocalProgress(): Record<string, number[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(topicId: string, phase: number) {
  try {
    const progress = getLocalProgress();
    const existing = progress[topicId] || [];
    if (!existing.includes(phase)) {
      progress[topicId] = [...existing, phase];
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    }
  } catch {}
}

function getLocalPhaseCache(topicId: string, phase: number): string | null {
  try {
    const raw = localStorage.getItem(PHASE_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    return cache[`${topicId}_${phase}`] || null;
  } catch {
    return null;
  }
}

function saveLocalPhaseCache(topicId: string, phase: number, content: string) {
  try {
    const raw = localStorage.getItem(PHASE_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[`${topicId}_${phase}`] = content;
    localStorage.setItem(PHASE_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

const PHASE_MESSAGES: Record<number, string> = {
  1: "Claude is preparing your Intel Brief with deep research...",
  2: "Claude is writing your 3-minute Model Script...",
  3: "Claude is generating your 10 Concept Fire questions...",
  5: "Claude is building your personalised Weak Point Fix session...",
};

export default function TopicPage() {
  const params = useParams();
  const topicId = params.topicId as string;

  const topic = getTopicById(topicId);
  const { prev, next } = topic ? getAdjacentTopics(topicId) : { prev: null, next: null };

  const [currentPhase, setCurrentPhase] = useState<PhaseNumber>(1);
  const [phaseContents, setPhaseContents] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);
  const [fromCache, setFromCache] = useState(false);

  // Phase 4 state
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [gradedDelivery, setGradedDelivery] = useState<string>("");

  // Load progress from localStorage
  useEffect(() => {
    const progress = getLocalProgress();
    setCompletedPhases(progress[topicId] || []);
  }, [topicId]);

  const loadPhase = useCallback(
    async (phase: PhaseNumber, forceRefresh = false) => {
      if (phase === 4 || phase === 6) return; // No auto-load for these

      // Check local memory cache first
      if (!forceRefresh && phaseContents[phase]) return;

      // For phase 5, only load if grading result exists
      if (phase === 5 && !gradingResult) return;

      setIsLoading(true);
      setError(null);
      setFromCache(false);

      try {
        // Try localStorage cache first (for instant loads on revisit)
        if (!forceRefresh && phase <= 3) {
          const localCached = getLocalPhaseCache(topicId, phase);
          if (localCached) {
            setPhaseContents((prev) => ({ ...prev, [phase]: localCached }));
            setFromCache(true);
            setIsLoading(false);
            saveProgress(topicId, phase);
            setCompletedPhases(getLocalProgress()[topicId] || []);
            return;
          }
        }

        if (phase === 5 && gradingResult && gradedDelivery) {
          // Phase 5 is personalized — call weakpoints API
          const res = await fetch("/api/weakpoints", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topicId,
              topicName: topic?.name,
              gradingResult,
              delivery: gradedDelivery,
            }),
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.error || "Failed to generate weak point fix");
          const content = json.data;
          setPhaseContents((prev) => ({ ...prev, [phase]: content }));
          setFromCache(false);
        } else if (phase <= 3) {
          // Phases 1-3 — use generate API (cached in Supabase)
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topicId,
              topicName: topic?.name,
              phase,
            }),
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.error || "Failed to generate content");
          const content = json.data;
          setPhaseContents((prev) => ({ ...prev, [phase]: content }));
          setFromCache(json.cached || false);

          // Save to localStorage for faster future loads
          if (phase <= 3) {
            saveLocalPhaseCache(topicId, phase, content);
          }
        }

        saveProgress(topicId, phase);
        setCompletedPhases(getLocalProgress()[topicId] || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [topicId, topic, phaseContents, gradingResult, gradedDelivery]
  );

  // Auto-load when phase changes
  useEffect(() => {
    if (topic) {
      loadPhase(currentPhase);
    }
  }, [currentPhase, topic]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGraded = (result: GradingResult, delivery: string) => {
    setGradingResult(result);
    setGradedDelivery(delivery);
    saveProgress(topicId, 4);
    setCompletedPhases(getLocalProgress()[topicId] || []);
  };

  const handlePhaseChange = (phase: PhaseNumber) => {
    setError(null);
    setCurrentPhase(phase);
    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!topic) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Topic not found</h1>
            <Link href="/">
              <button className="mt-4 px-4 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: "#1a2744" }}>
                Back to Topics
              </button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const phaseLabels: Record<PhaseNumber, string> = {
    1: "Intel Brief",
    2: "Model Script",
    3: "Concept Fire",
    4: "Live Mock",
    5: "Weak Point Fix",
    6: "Complete",
  };

  const renderPhaseContent = () => {
    if (currentPhase === 6) {
      const bestGrade =
        gradingResult?.grade ||
        (completedPhases.includes(4) ? "borderline" : undefined);
      return (
        <Phase6Complete
          topic={topic}
          nextTopic={next}
          prevTopic={prev}
          gradeAchieved={bestGrade}
        />
      );
    }

    if (currentPhase === 4) {
      return (
        <Phase4LiveMock
          topicId={topicId}
          topicName={topic.name}
          intelBrief={phaseContents[1] || ""}
          onGraded={handleGraded}
          savedGrade={gradingResult}
          savedDelivery={gradedDelivery}
        />
      );
    }

    if (isLoading) {
      return <LoadingSkeleton message={PHASE_MESSAGES[currentPhase] || "Preparing content..."} />;
    }

    if (error) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-red-700 font-medium mb-1">Something went wrong</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => loadPhase(currentPhase, true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "#1a2744" }}
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      );
    }

    const content = phaseContents[currentPhase];
    if (!content) return null;

    if (currentPhase === 3) {
      try {
        const questions: ConceptFireQA[] = JSON.parse(content);
        return <Phase3ConceptFire questions={questions} />;
      } catch {
        return <MarkdownContent content={content} />;
      }
    }

    return <MarkdownContent content={content} />;
  };

  const categoryColors: Record<string, string> = {
    "below-average": "bg-emerald-100 text-emerald-700",
    average: "bg-amber-100 text-amber-700",
    "above-average": "bg-red-100 text-red-700",
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Topic Header */}
      <div className="text-white py-6 px-4" style={{ backgroundColor: "#1a2744" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-3">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> All Topics
            </Link>
            <span>/</span>
            <span>{CATEGORY_LABELS[topic.category]}</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{ backgroundColor: "#c9a84c", color: "#1a2744" }}
                >
                  #{topic.number}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[topic.category]}`}
                >
                  {CATEGORY_LABELS[topic.category]}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">{topic.name}</h1>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 w-full">
        {/* Topic Navigator */}
        <div className="mb-5">
          <TopicNavigator
            currentTopic={topic}
            prevTopic={prev}
            nextTopic={next}
          />
        </div>

        {/* Phase Navigation */}
        <div className="mb-5">
          <PhaseNav
            currentPhase={currentPhase}
            completedPhases={completedPhases}
            onPhaseChange={handlePhaseChange}
          />
        </div>

        {/* Phase Content Area */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Phase header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: "#1a2744" }}
                >
                  Phase {currentPhase}
                </span>
                <h2 className="font-bold text-slate-800">
                  {phaseLabels[currentPhase]}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {fromCache && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Database className="w-3 h-3" />
                  Cached
                </span>
              )}
              {!fromCache && !isLoading && phaseContents[currentPhase] && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Zap className="w-3 h-3" />
                  Generated
                </span>
              )}
              {currentPhase <= 3 && phaseContents[currentPhase] && !isLoading && (
                <button
                  onClick={() => loadPhase(currentPhase, true)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
                  title="Regenerate"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Phase body */}
          <div className="p-5 sm:p-6">{renderPhaseContent()}</div>
        </div>

        {/* Phase completion buttons */}
        {!isLoading &&
          !error &&
          currentPhase < 6 &&
          phaseContents[currentPhase] && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  const nextPhase = Math.min(
                    currentPhase + 1,
                    6
                  ) as PhaseNumber;
                  handlePhaseChange(nextPhase);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: "#c9a84c" }}
              >
                Continue to Phase {currentPhase + 1} →
              </button>
            </div>
          )}
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200">
        SSB Lecturette Prep • AI-Powered by Claude Sonnet 4.6
      </footer>
    </div>
  );
}
