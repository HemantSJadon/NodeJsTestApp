'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import type { Review, Message } from '@/types/game';

let socket: Socket;
function getSocket() {
  if (!socket) socket = io({ transports: ['websocket', 'polling'] });
  return socket;
}

const SCORE_COLORS = ['text-red-400', 'text-orange-400', 'text-amber-400', 'text-yellow-400', 'text-lime-400', 'text-green-400', 'text-emerald-400'];
const PANEL_LABELS: Record<string, string> = {
  collaborative: '🤝 Collaborative Panel',
  competitive: '🏆 Competitive Panel',
  hostile: '⚡ Hostile Panel',
  mixed: '🎭 Mixed Panel',
};

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = (score / 10) * 100;
  const color =
    score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-indigo-500' : score >= 4 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className={`font-bold ${SCORE_COLORS[Math.floor(score) - 1] || 'text-white'}`}>
          {score}/10
        </span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full score-bar ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ReviewCard({ review, isHighlighted }: { review: Review; isHighlighted: boolean }) {
  const [expanded, setExpanded] = useState(isHighlighted);
  const overallColor =
    review.scores.overall >= 8
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
      : review.scores.overall >= 6
      ? 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5'
      : review.scores.overall >= 4
      ? 'text-amber-400 border-amber-500/30 bg-amber-500/5'
      : 'text-red-400 border-red-500/30 bg-red-500/5';

  return (
    <div
      className={`glass-card border transition-all ${
        isHighlighted ? 'border-cyan-500/40 ring-1 ring-cyan-500/20' : 'border-white/8'
      }`}
    >
      <div
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base ${
              review.isHuman ? 'bg-cyan-900/50 text-cyan-400 ring-1 ring-cyan-500/30' : 'bg-slate-700 text-white'
            }`}
          >
            {review.isHuman ? '🎤' : review.candidateName.split(' ').map((w) => w[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-white">
              {review.candidateName}
              {review.isHuman && <span className="ml-2 text-xs text-cyan-400">(You)</span>}
            </div>
            <div className="text-xs text-slate-500">{expanded ? 'Click to collapse' : 'Click to expand'}</div>
          </div>
        </div>
        <div className={`text-2xl font-bold px-3 py-1 rounded-lg border ${overallColor}`}>
          {review.scores.overall}/10
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-4">
          {/* Score bars */}
          <div className="mb-4">
            <ScoreBar label="Communication" score={review.scores.communication} />
            <ScoreBar label="Content & Depth" score={review.scores.content} />
            <ScoreBar label="Leadership" score={review.scores.leadership} />
            <ScoreBar label="Listening" score={review.scores.listening} />
            <ScoreBar label="Initiative" score={review.scores.initiative} />
          </div>

          {/* Feedback */}
          <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-white/5">
            <div className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Panel Feedback</div>
            <div className="text-sm text-slate-200 leading-relaxed">{review.feedback}</div>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-emerald-400 font-medium mb-2 flex items-center gap-1">
                ✓ Strengths
              </div>
              <ul className="space-y-1">
                {review.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs text-amber-400 font-medium mb-2 flex items-center gap-1">
                ↑ Improvements
              </div>
              <ul className="space-y-1">
                {review.improvements.map((s, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const humanName = searchParams.get('name') || 'You';

  const [reviews, setReviews] = useState<Review[]>([]);
  const [roomInfo, setRoomInfo] = useState<{
    topic: string;
    panelType: string;
    humanName: string;
    messages: Message[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rankings' | 'transcript'>('rankings');

  useEffect(() => {
    const s = getSocket();

    const fetchData = () => {
      s.emit('get-reviews', { roomId }, (res: {
        reviews?: Review[];
        room?: { topic: string; panelType: string; humanName: string; messages: Message[] };
        error?: string;
      }) => {
        setLoading(false);
        if (res.error) return;
        if (res.reviews) setReviews(res.reviews);
        if (res.room) setRoomInfo(res.room);
      });
    };

    if (s.connected) {
      fetchData();
    } else {
      s.on('connect', fetchData);
    }

    s.on('reviews-ready', ({ roomId: rid }: { roomId: string }) => {
      if (rid === roomId) fetchData();
    });

    return () => {
      s.off('connect', fetchData);
      s.off('reviews-ready');
    };
  }, [roomId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⚙️</div>
          <p className="text-slate-400">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-slate-400 mb-4">Reviews are still being generated...</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Sort by overall score
  const sorted = [...reviews].sort((a, b) => b.scores.overall - a.scores.overall);
  const humanReview = reviews.find((r) => r.isHuman);
  const humanRank = sorted.findIndex((r) => r.isHuman) + 1;

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
          ← Back to Rooms
        </button>
        <div className="glass-card p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">{PANEL_LABELS[roomInfo?.panelType || 'mixed'] || 'Group Discussion'}</div>
              <h1 className="text-xl font-bold text-white mb-1">{roomInfo?.topic || 'Discussion Review'}</h1>
              <div className="text-sm text-slate-400">{reviews.length} participants evaluated</div>
            </div>
            {humanReview && (
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">Your Rank</div>
                <div className="text-3xl font-bold text-white">
                  #{humanRank}
                  <span className="text-slate-500 text-lg font-normal"> / {reviews.length}</span>
                </div>
                <div className={`text-lg font-bold mt-1 ${
                  humanReview.scores.overall >= 8 ? 'text-emerald-400' :
                  humanReview.scores.overall >= 6 ? 'text-indigo-400' :
                  humanReview.scores.overall >= 4 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {humanReview.scores.overall}/10 Overall
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('rankings')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'rankings' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Individual Reviews
        </button>
        <button
          onClick={() => setActiveTab('transcript')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'transcript' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Full Transcript
        </button>
      </div>

      {activeTab === 'rankings' && (
        <div className="space-y-4">
          {/* Leaderboard quick view */}
          <div className="glass-card p-4 mb-2">
            <div className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Leaderboard</div>
            <div className="space-y-2">
              {sorted.map((r, i) => (
                <div key={r.candidateId} className="flex items-center gap-3">
                  <div className={`w-6 text-sm font-bold ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-700' : 'text-slate-500'}`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 text-sm text-white">
                    {r.candidateName}
                    {r.isHuman && <span className="ml-1 text-xs text-cyan-400">(You)</span>}
                  </div>
                  <div className="flex gap-1">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden" style={{ width: 80 }}>
                      <div
                        className={`h-full rounded-full ${r.scores.overall >= 8 ? 'bg-emerald-500' : r.scores.overall >= 6 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                        style={{ width: `${(r.scores.overall / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-300 w-8 text-right">{r.scores.overall}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Individual review cards — human first */}
          {[
            ...(humanReview ? [humanReview] : []),
            ...sorted.filter((r) => !r.isHuman),
          ].map((review) => (
            <ReviewCard key={review.candidateId} review={review} isHighlighted={review.isHuman} />
          ))}
        </div>
      )}

      {activeTab === 'transcript' && roomInfo?.messages && (
        <div className="glass-card p-4">
          <div className="space-y-3 max-h-[600px] overflow-y-auto transcript-scroll">
            {roomInfo.messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 text-sm ${msg.isHuman ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  msg.isModerator ? 'bg-slate-600 text-slate-200' :
                  msg.isHuman ? 'bg-cyan-800 text-cyan-300' : 'bg-indigo-800 text-indigo-200'
                }`}>
                  {msg.isModerator ? 'M' : msg.speakerName[0]}
                </div>
                <div className={`flex-1 ${msg.isHuman ? 'text-right' : ''}`}>
                  <div className={`text-xs font-medium mb-0.5 ${
                    msg.isModerator ? 'text-slate-400' : msg.isHuman ? 'text-cyan-400' : 'text-indigo-400'
                  }`}>
                    {msg.speakerName}
                  </div>
                  <div className={`inline-block text-left px-3 py-2 rounded-lg text-slate-200 max-w-lg ${
                    msg.isModerator ? 'bg-slate-700/60' : msg.isHuman ? 'bg-cyan-900/40' : 'bg-slate-800/70'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors"
        >
          Start Another Discussion
        </button>
      </div>
    </div>
  );
}
