"use client";

import { useState } from "react";
import { ConceptFireQA } from "@/types";
import { Eye, EyeOff, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

interface Phase3ConceptFireProps {
  questions: ConceptFireQA[];
}

export default function Phase3ConceptFire({ questions }: Phase3ConceptFireProps) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [allRevealed, setAllRevealed] = useState(false);

  const toggleReveal = (index: number) => {
    setRevealed((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const revealAll = () => {
    const all: Record<number, boolean> = {};
    questions.forEach((_, i) => (all[i] = true));
    setRevealed(all);
    setAllRevealed(true);
  };

  const hideAll = () => {
    setRevealed({});
    setAllRevealed(false);
  };

  const revealedCount = Object.values(revealed).filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="px-3 py-1.5 rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: "#1a2744" }}
          >
            {revealedCount}/{questions.length} answered
          </div>
          {revealedCount === questions.length && (
            <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              All answered!
            </div>
          )}
        </div>
        <button
          onClick={allRevealed ? hideAll : revealAll}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
        >
          {allRevealed ? (
            <>
              <EyeOff className="w-4 h-4" /> Hide All
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" /> Reveal All
            </>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {questions.map((qa, index) => (
          <div
            key={index}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all duration-200"
          >
            <button
              onClick={() => toggleReveal(index)}
              className="w-full flex items-start gap-4 p-4 text-left"
            >
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                style={{ backgroundColor: "#1a2744" }}
              >
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium text-slate-800 leading-relaxed">
                  {qa.question}
                </p>
              </div>
              <div className="flex-shrink-0 mt-0.5">
                {revealed[index] ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {revealed[index] && (
              <div
                className="px-4 pb-4 pt-0 ml-11 border-t border-slate-100"
              >
                <div
                  className="mt-3 p-3 rounded-lg border-l-4 text-sm text-slate-700 leading-relaxed"
                  style={{
                    backgroundColor: "#fefdf5",
                    borderColor: "#c9a84c",
                  }}
                >
                  <span
                    className="text-xs font-semibold uppercase tracking-wide block mb-1"
                    style={{ color: "#c9a84c" }}
                  >
                    Answer
                  </span>
                  {qa.answer}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
