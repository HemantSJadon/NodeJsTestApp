"use client";

import { Topic } from "@/types";
import TopicCard from "./TopicCard";

interface TopicGridProps {
  topics: Topic[];
  completedByTopic: Record<string, number[]>;
}

export default function TopicGrid({ topics, completedByTopic }: TopicGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {topics.map((topic) => (
        <TopicCard
          key={topic.id}
          topic={topic}
          completedPhases={completedByTopic[topic.id] || []}
        />
      ))}
    </div>
  );
}
