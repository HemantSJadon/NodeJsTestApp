"use client";

import { useState } from "react";
import { GradingResult } from "@/types";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Send,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Phase4LiveMockProps {
  topicId: string;
  topicName: string;
  intelBrief: string;
  onGraded: (result: GradingResult, delivery: string) => void;
  savedGrade?: GradingResult | null;
  savedDelivery?: string;
}

const gradeConfig = {
  ready: {
    label: "Ready",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-400",
    badge: "bg-green-600",
    icon: CheckCircle,
    emoji: "🟢",
    message: "Strong delivery! You're ready to face the SSB panel on this topic.",
  },
  borderline: {
    label: "Borderline",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-400",
    badge: "bg-amber-600",
    icon: AlertCircle,
    emoji: "🟡",
    message: "Getting there. Review the weak points and do one more round.",
  },
  retry: {
    label: "Retry",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-400",
    badge: "bg-red-600",
    icon: XCircle,
    emoji: "🔴",
    message: "Go back to the Model Script (Phase 2), read it 3 times, then try again.",
  },
};

export default function Phase4LiveMock({
  topicId,
  topicName,
  intelBrief,
  onGraded,
  savedGrade,
  savedDelivery,
}: Phase4LiveMockProps) {
  const [delivery, setDelivery] = useState(savedDelivery || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(savedGrade || null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);

  const wordCount = delivery.trim().split(/\s+/).filter(Boolean).length;
  const targetWords = 350;

  const handleSubmit = async () => {
    if (delivery.trim().length < 50) {
      setError("Please write at least 50 characters before submitting.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          topicName,
          delivery,
          intelBrief: intelBrief.substring(0, 3000),
        }),
      });

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || "Grading failed");
      }

      setGradingResult(json.data);
      onGraded(json.data, delivery);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to grade. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setGradingResult(null);
    setDelivery("");
    setError(null);
  };

  if (gradingResult) {
    const cfg = gradeConfig[gradingResult.grade];
    const GradeIcon = cfg.icon;

    return (
      <div className="space-y-5">
        {/* Grade Result */}
        <div className={`rounded-2xl border-2 p-5 ${cfg.bg} ${cfg.border}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-xl ${cfg.badge}`}>
              <GradeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className={`text-xl font-bold ${cfg.color}`}>
                {cfg.emoji} {cfg.label} — {gradingResult.score}/10
              </div>
              <div className="text-sm text-slate-600 mt-0.5">{cfg.message}</div>
            </div>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showDetails ? "Hide" : "Show"} detailed feedback
          </button>
        </div>

        {showDetails && (
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Strengths
              </h4>
              <ul className="space-y-2">
                {gradingResult.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Areas to Improve
              </h4>
              <ul className="space-y-2">
                {gradingResult.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✗</span> {w}
                  </li>
                ))}
              </ul>
            </div>

            {/* Corrections */}
            <div className="sm:col-span-2 bg-amber-50 rounded-xl border border-amber-200 p-4">
              <h4 className="font-semibold text-amber-800 mb-3">
                🎯 Specific Corrections / Additions
              </h4>
              <ul className="space-y-2">
                {gradingResult.corrections.map((c, i) => (
                  <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="font-bold text-amber-600">{i + 1}.</span> {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Overall feedback */}
            <div className="sm:col-span-2 rounded-xl border border-slate-200 p-4" style={{ backgroundColor: "#f8fafc" }}>
              <h4 className="font-semibold text-slate-800 mb-2">Overall Assessment</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{gradingResult.overallFeedback}</p>
            </div>
          </div>
        )}

        {/* Your delivery */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700">
            View your delivery
          </summary>
          <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600 whitespace-pre-wrap">
            {delivery}
          </div>
        </details>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div
        className="rounded-xl border-l-4 p-4 text-sm"
        style={{
          backgroundColor: "#fefdf5",
          borderColor: "#c9a84c",
        }}
      >
        <p className="font-semibold text-slate-800 mb-1">📋 Instructions</p>
        <ul className="text-slate-600 space-y-1">
          <li>• Write your 3-minute lecturette on <strong>{topicName}</strong> in the box below</li>
          <li>• Target: <strong>{targetWords} words</strong> (~3 minutes of speaking)</li>
          <li>• Imagine you're addressing the SSB panel — be confident, structured, factual</li>
          <li>• Include at least: opening hook, 2-3 facts, defence angle, strong conclusion</li>
        </ul>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-700">
            Your Lecturette Delivery
          </label>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              wordCount >= targetWords
                ? "bg-green-100 text-green-700"
                : wordCount >= targetWords * 0.6
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {wordCount} / {targetWords} words
          </span>
        </div>
        <textarea
          value={delivery}
          onChange={(e) => setDelivery(e.target.value)}
          placeholder={`Start your lecturette here...\n\nExample opening: "Respected panel and fellow candidates — the topic I have chosen today is ${topicName}. [Your hook/opening sentence here]"`}
          className="w-full h-72 p-4 rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none resize-none text-sm leading-relaxed text-slate-700 transition-all"
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-4 py-3 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || delivery.trim().length < 50}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: isSubmitting ? "#6b7280" : "#1a2744" }}
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Grading your delivery...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Submit for Grading
          </>
        )}
      </button>
    </div>
  );
}
