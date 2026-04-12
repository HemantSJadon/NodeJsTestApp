"use client";

import { TopicCategory } from "@/types";
import { CATEGORY_LABELS, CATEGORY_ORDER, TOPICS_BY_CATEGORY } from "@/data/topics";

interface CategoryTabsProps {
  selected: TopicCategory;
  onSelect: (category: TopicCategory) => void;
}

const categoryColors: Record<TopicCategory, string> = {
  "below-average": "text-emerald-700 border-emerald-500 bg-emerald-50",
  average: "text-amber-700 border-amber-500 bg-amber-50",
  "above-average": "text-red-700 border-red-500 bg-red-50",
};

const categoryActiveColors: Record<TopicCategory, string> = {
  "below-average": "bg-emerald-600 text-white border-emerald-600",
  average: "bg-amber-600 text-white border-amber-600",
  "above-average": "bg-red-600 text-white border-red-600",
};

const difficultyLabel: Record<TopicCategory, string> = {
  "below-average": "Starter",
  average: "Intermediate",
  "above-average": "Advanced",
};

export default function CategoryTabs({ selected, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {CATEGORY_ORDER.map((category) => {
        const count = TOPICS_BY_CATEGORY[category].length;
        const isSelected = selected === category;
        return (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-medium transition-all duration-200 ${
              isSelected
                ? categoryActiveColors[category]
                : `${categoryColors[category]} hover:opacity-80`
            }`}
          >
            <div>
              <div className="text-sm font-semibold">{CATEGORY_LABELS[category]}</div>
              <div className={`text-xs ${isSelected ? "text-white/80" : "opacity-70"}`}>
                {difficultyLabel[category]} • {count} topics
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
