"use client";

import Link from "next/link";
import { Topic, TopicCategory } from "@/types";
import { ChevronRight, CheckCircle, Clock, BookOpen } from "lucide-react";

interface TopicCardProps {
  topic: Topic;
  completedPhases?: number[];
}

const categoryBadgeColors: Record<TopicCategory, string> = {
  "below-average": "bg-emerald-100 text-emerald-700",
  average: "bg-amber-100 text-amber-700",
  "above-average": "bg-red-100 text-red-700",
};

function getStatusInfo(completedPhases: number[]) {
  if (completedPhases.length === 0) return { label: "Not Started", icon: BookOpen, color: "text-slate-400" };
  if (completedPhases.includes(4)) return { label: "Graded", icon: CheckCircle, color: "text-green-600" };
  return { label: `Phase ${Math.max(...completedPhases)} done`, icon: Clock, color: "text-amber-600" };
}

export default function TopicCard({ topic, completedPhases = [] }: TopicCardProps) {
  const status = getStatusInfo(completedPhases);
  const StatusIcon = status.icon;

  return (
    <Link href={`/topic/${topic.id}`}>
      <div className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-400 hover:shadow-md transition-all duration-200 cursor-pointer h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <span
            className="text-xs font-bold px-2 py-1 rounded-full"
            style={{ backgroundColor: "#1a2744", color: "#c9a84c" }}
          >
            #{topic.number}
          </span>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${categoryBadgeColors[topic.category]}`}
          >
            {topic.category === "below-average"
              ? "Below Avg"
              : topic.category === "above-average"
              ? "Above Avg"
              : "Average"}
          </span>
        </div>

        <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-3 flex-1 group-hover:text-navy-900">
          {topic.name}
        </h3>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
          <div className={`flex items-center gap-1 text-xs ${status.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{status.label}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
