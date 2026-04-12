"use client";

import Link from "next/link";
import { Shield, Target } from "lucide-react";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 text-white shadow-lg"
      style={{ backgroundColor: "#1a2744" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ backgroundColor: "#c9a84c" }}
            >
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">SSB Lecturette Prep</div>
              <div className="text-xs text-slate-300 leading-tight">AI-Powered Defence Officer Training</div>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-300">
              <Target className="w-4 h-4" style={{ color: "#c9a84c" }} />
              <span>203 Topics • 6-Phase System</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
