"use client";

import { useState } from "react";
import Link from "next/link";
import { Topic } from "@/types";
import { ALL_TOPICS, CATEGORY_LABELS } from "@/data/topics";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

interface TopicNavigatorProps {
  currentTopic: Topic;
  prevTopic: Topic | null;
  nextTopic: Topic | null;
}

export default function TopicNavigator({
  currentTopic,
  prevTopic,
  nextTopic,
}: TopicNavigatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = ALL_TOPICS.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {prevTopic ? (
          <Link href={`/topic/${prevTopic.id}`}>
            <button className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap max-w-[140px] truncate">
              <ChevronLeft className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{prevTopic.name}</span>
            </button>
          </Link>
        ) : (
          <div className="w-10" />
        )}

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 flex-1"
          style={{ backgroundColor: "#1a2744" }}
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline truncate">Jump to Topic</span>
          <span className="sm:hidden">Topics</span>
        </button>

        {nextTopic ? (
          <Link href={`/topic/${nextTopic.id}`}>
            <button className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap max-w-[140px] truncate">
              <span className="truncate">{nextTopic.name}</span>
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            </button>
          </Link>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Jump Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search topics..."
                    className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
                  />
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2">
              {filtered.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">
                  No topics found
                </p>
              ) : (
                filtered.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/topic/${topic.id}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        topic.id === currentTopic.id
                          ? "text-white"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                      style={
                        topic.id === currentTopic.id
                          ? { backgroundColor: "#1a2744" }
                          : {}
                      }
                    >
                      <span
                        className={`text-xs font-bold w-7 text-center ${
                          topic.id === currentTopic.id
                            ? "text-white/70"
                            : "text-slate-400"
                        }`}
                      >
                        #{topic.number}
                      </span>
                      <span className="text-sm font-medium flex-1">{topic.name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          topic.id === currentTopic.id
                            ? "bg-white/20 text-white/80"
                            : topic.category === "below-average"
                            ? "bg-emerald-100 text-emerald-700"
                            : topic.category === "above-average"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {CATEGORY_LABELS[topic.category].split(" ")[0]}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
