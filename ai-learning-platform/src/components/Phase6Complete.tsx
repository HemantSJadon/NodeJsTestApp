"use client";

import Link from "next/link";
import { Topic } from "@/types";
import { CheckCircle2, ChevronRight, Trophy, ArrowLeft } from "lucide-react";

interface Phase6CompleteProps {
  topic: Topic;
  nextTopic: Topic | null;
  prevTopic: Topic | null;
  gradeAchieved?: string;
}

export default function Phase6Complete({
  topic,
  nextTopic,
  prevTopic,
  gradeAchieved,
}: Phase6CompleteProps) {
  return (
    <div className="text-center py-8">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: "#1a274415" }}
      >
        <CheckCircle2 className="w-12 h-12" style={{ color: "#1a2744" }} />
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        Topic Complete!
      </h2>
      <p className="text-slate-600 mb-2">
        You have completed all phases for{" "}
        <span className="font-semibold text-slate-800">{topic.name}</span>
      </p>

      {gradeAchieved && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8 mt-2">
          <Trophy className="w-4 h-4" style={{ color: "#c9a84c" }} />
          <span className="text-slate-700">
            Best Grade:{" "}
            <span
              className={
                gradeAchieved === "ready"
                  ? "text-green-700"
                  : gradeAchieved === "borderline"
                  ? "text-amber-700"
                  : "text-red-700"
              }
            >
              {gradeAchieved === "ready"
                ? "🟢 Ready"
                : gradeAchieved === "borderline"
                ? "🟡 Borderline"
                : "🔴 Retry Needed"}
            </span>
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
        <Link href="/">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors font-medium text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Topics
          </button>
        </Link>

        {nextTopic && (
          <Link href={`/topic/${nextTopic.id}`}>
            <button
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: "#1a2744" }}
            >
              Next: {nextTopic.name}
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200">
        <p className="text-sm text-slate-500 mb-3">Continue with any topic:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {prevTopic && (
            <Link href={`/topic/${prevTopic.id}`}>
              <button className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                ← {prevTopic.name}
              </button>
            </Link>
          )}
          {nextTopic && (
            <Link href={`/topic/${nextTopic.id}`}>
              <button className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                {nextTopic.name} →
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
