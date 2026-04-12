"use client";

import { PhaseNumber } from "@/types";
import {
  FileText,
  Mic,
  Zap,
  PlayCircle,
  Wrench,
  CheckCircle2,
} from "lucide-react";

interface PhaseNavProps {
  currentPhase: PhaseNumber;
  completedPhases: number[];
  onPhaseChange: (phase: PhaseNumber) => void;
}

const PHASES: Array<{
  number: PhaseNumber;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
}> = [
  {
    number: 1,
    label: "Intel Brief",
    shortLabel: "Intel",
    icon: FileText,
    description: "Full topic breakdown",
  },
  {
    number: 2,
    label: "Model Script",
    shortLabel: "Script",
    icon: Mic,
    description: "3-min ready script",
  },
  {
    number: 3,
    label: "Concept Fire",
    shortLabel: "Q&A",
    icon: Zap,
    description: "10 rapid questions",
  },
  {
    number: 4,
    label: "Live Mock",
    shortLabel: "Mock",
    icon: PlayCircle,
    description: "Deliver & get graded",
  },
  {
    number: 5,
    label: "Weak Point Fix",
    shortLabel: "Fix",
    icon: Wrench,
    description: "Targeted corrections",
  },
  {
    number: 6,
    label: "Complete",
    shortLabel: "Done",
    icon: CheckCircle2,
    description: "Topic complete",
  },
];

export default function PhaseNav({
  currentPhase,
  completedPhases,
  onPhaseChange,
}: PhaseNavProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-1 min-w-max sm:min-w-0 sm:flex-wrap pb-1">
        {PHASES.map((phase) => {
          const Icon = phase.icon;
          const isCurrent = currentPhase === phase.number;
          const isComplete = completedPhases.includes(phase.number);

          return (
            <button
              key={phase.number}
              onClick={() => onPhaseChange(phase.number)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                isCurrent
                  ? "text-white shadow-md"
                  : isComplete
                  ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
              style={isCurrent ? { backgroundColor: "#1a2744" } : {}}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {isComplete && !isCurrent && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </div>
              <span className="hidden sm:inline">{phase.label}</span>
              <span className="sm:hidden">{phase.shortLabel}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  isCurrent
                    ? "text-white/80 bg-white/20"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {phase.number}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
