'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import type { Review, Message } from '@/types/game';

let _socket: Socket | null = null;
function getSocket(): Socket {
  if (!_socket || _socket.disconnected) _socket = io({ transports: ['websocket', 'polling'] });
  return _socket;
}

const PANEL_LABELS: Record<string, string> = {
  collaborative: '🤝 Collaborative', competitive: '🏆 Competitive',
  hostile: '⚡ Hostile', mixed: '🎭 Mixed',
};

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = ((score || 0) / 10) * 100;
  const barColor = score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-indigo-500' : score >= 4 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = score >= 8 ? 'text-emerald-400' : score >= 6 ? 'text-indigo-400' : score >= 4 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className={`font-bold ${textColor}`}>{score}/10</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full score-bar ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ReviewCard({ review, rank, isHighlighted }: { review: Review; rank: number; isHighlighted: boolean }) {
  const [open, setOpen] = useState(isHighlighted);
  const overall = review.scores?.overall ?? 0;
  const overallStyle = overall >= 8 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' :
    overall >= 6 ? 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5' :
    overall >= 4 ? 'text-amber-400 border-amber-500/30 bg-amber-500/5' :
    'text-red-400 border-red-500/30 bg-red-500/5';
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  return (
    <div className={`glass-card transition-all ${isHighlighted ? 'border border-cyan-500/40 ring-1 ring-cyan-500/15' : 'border border-white/8'}`}>
      <div className="p-4 cursor-pointer flex items-center gap-3" onClick={() => setOpen((v) => !v)}>
        <div className="text-lg w-8 text-center shrink-0">{medal}</div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
          review.isHuman ? 'bg-cyan-900/50 text-cyan-300 ring-1 ring-cyan-500/30' : 'bg-slate-700 text-white'}`}>
          {review.isHuman ? '🎤' : review.candidateName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm">
            {review.candidateName}
            {review.isHuman && <span className="ml-1.5 text-xs text-cyan-400 font-normal">(You)</span>}
          </div>
          <div className="text-xs text-slate-500">{open ? 'Click to collapse' : 'Click to expand'}</div>
        </div>
        <div className={`text-xl font-bold px-3 py-1 rounded-lg border shrink-0 ${overallStyle}`}>
          {overall}/10
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
          <div>
            <ScoreBar label="Communication" score={review.scores?.communication ?? 0} />
            <ScoreBar label="Content & Depth" score={review.scores?.content ?? 0} />
            <ScoreBar label="Leadership" score={review.scores?.leadership ?? 0} />
            <ScoreBar label="Listening" score={review.scores?.listening ?? 0} />
            <ScoreBar label="Initiative" score={review.scores?.initiative ?? 0} />
          </div>

          <div className="p-3 bg-slate-800/50 rounded-lg border border-white/5">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 font-medium">Panel Feedback</div>
            <p className="text-sm text-slate-200 leading-relaxed">{review.feedback}</p>
          </div>

          {review.standoutMoment && (
            <div className="p-3 bg-indigo-900/20 rounded-lg border border-indigo-500/15">
              <div className="text-[10px] text-indigo-400 uppercase tracking-wider mb-1.5 font-medium">Standout Moment</div>
              <p className="text-xs text-slate-300 leading-relaxed italic">"{review.standoutMoment}"</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-emerald-400 font-medium mb-2">✓ Strengths</div>
              <ul className="space-y-1.5">
                {(review.strengths || []).map((s: string, i: number) => (
                  <li key={i} className="text-xs text-slate-300 flex gap-1.5 leading-relaxed">
                    <span className="text-emerald-500 shrink-0 mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs text-amber-400 font-medium mb-2">↑ Improve</div>
              <ul className="space-y-1.5">
                {(review.improvements || []).map((s: string, i: number) => (
                  <li key={i} className="text-xs text-slate-300 flex gap-1.5 leading-relaxed">
                    <span className="text-amber-500 shrink-0 mt-0.5">•</span>{s}
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

interface RoomInfo {
  topic: string; panelType: string; humanName: string;
  messages: Message[]; candidates: Array<{ id: string; name: string; speakingCount: number }>;
}

export default function ReviewPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const humanName = searchParams.get('name') || 'You';

  const [reviews, setReviews] = useState<Review[]>([]);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'reviews' | 'transcript'>('reviews');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = () => {
    const s = getSocket();
    s.emit('get-reviews', { roomId }, (res: {
      reviews?: Review[]; room?: RoomInfo; error?: string;
    }) => {
      if (res.error) { setLoading(false); return; }
      if (res.reviews && res.reviews.length > 0) {
        setReviews(res.reviews);
        if (res.room) setRoomInfo(res.room);
        setLoading(false);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    });
  };

  useEffect(() => {
    const s = getSocket();

    const start = () => {
      fetchData();
      // Auto-poll every 4 seconds until reviews arrive
      pollRef.current = setInterval(fetchData, 4000);
    };

    if (s.connected) start();
    else s.once('connect', start);

    s.on('reviews-ready', ({ roomId: rid }: { roomId: string }) => {
      if (rid === roomId) fetchData();
    });

    return () => {
      s.off('connect', start);
      s.off('reviews-ready');
      if (pollRef.current) clearInterval(pollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Tie-aware ranking: sorted by overall desc; same score = same rank
  const rankedReviews = useMemo(() => {
    const sorted = [...reviews].sort((a, b) => (b.scores?.overall ?? 0) - (a.scores?.overall ?? 0));
    let rank = 1;
    return sorted.map((r, i) => {
      if (i > 0 && (r.scores?.overall ?? 0) < (sorted[i - 1].scores?.overall ?? 0)) rank = i + 1;
      return { review: r, rank };
    });
  }, [reviews]);

  const humanReview = reviews.find((r) => r.isHuman);
  const humanEntry = rankedReviews.find((e) => e.review.isHuman);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-4xl animate-pulse">⚙️</div>
        <p className="text-slate-300 font-medium">Generating evaluations…</p>
        <p className="text-slate-500 text-sm">This takes about 20–30 seconds</p>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-4xl">📭</div>
        <p className="text-slate-400">No reviews found for this room.</p>
        <button onClick={() => router.push('/')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white text-sm mb-5 inline-block">
        ← New Discussion
      </button>

      {/* Header card */}
      <div className="glass-card p-5 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 mb-1">{PANEL_LABELS[roomInfo?.panelType || ''] || 'Group Discussion'}</div>
            <h1 className="text-lg font-bold text-white mb-1 leading-snug">{roomInfo?.topic || 'Discussion'}</h1>
            <div className="text-xs text-slate-500">{reviews.length} participants evaluated</div>
          </div>
          {humanEntry && (
            <div className="text-right shrink-0">
              <div className="text-xs text-slate-500 mb-0.5">Your Rank</div>
              <div className="text-3xl font-bold text-white leading-none">
                #{humanEntry.rank}
                <span className="text-slate-500 text-base font-normal"> / {reviews.length}</span>
              </div>
              <div className={`text-base font-bold mt-1 ${
                (humanReview?.scores.overall ?? 0) >= 8 ? 'text-emerald-400' :
                (humanReview?.scores.overall ?? 0) >= 6 ? 'text-indigo-400' :
                (humanReview?.scores.overall ?? 0) >= 4 ? 'text-amber-400' : 'text-red-400'}`}>
                {humanReview?.scores.overall ?? '—'}/10
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['reviews', 'transcript'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            {t === 'reviews' ? 'Individual Reviews' : 'Full Transcript'}
          </button>
        ))}
      </div>

      {tab === 'reviews' && (
        <div className="space-y-3">
          {/* Mini leaderboard */}
          <div className="glass-card p-4 mb-2">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-3 font-medium">Leaderboard</div>
            <div className="space-y-2">
              {rankedReviews.map(({ review: r, rank: rk }) => (
                <div key={r.candidateId} className="flex items-center gap-2">
                  <div className={`text-sm w-6 text-center font-bold ${rk === 1 ? 'text-amber-400' : rk === 2 ? 'text-slate-300' : rk === 3 ? 'text-amber-700' : 'text-slate-500'}`}>
                    #{rk}
                  </div>
                  <div className="flex-1 text-sm text-white truncate">
                    {r.candidateName}{r.isHuman && <span className="ml-1 text-xs text-cyan-400">(You)</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${(r.scores?.overall ?? 0) >= 8 ? 'bg-emerald-500' : (r.scores?.overall ?? 0) >= 6 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                        style={{ width: `${((r.scores?.overall ?? 0) / 10) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-300 w-6 text-right">{r.scores?.overall ?? '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cards — human first */}
          {[
            ...(humanEntry ? [humanEntry] : []),
            ...rankedReviews.filter((e) => !e.review.isHuman),
          ].map(({ review: r, rank: rk }) => (
            <ReviewCard key={r.candidateId} review={r} rank={rk} isHighlighted={r.isHuman} />
          ))}
        </div>
      )}

      {tab === 'transcript' && roomInfo?.messages && (
        <div className="glass-card p-4">
          <div className="space-y-3 max-h-[560px] overflow-y-auto transcript-scroll pr-1">
            {roomInfo.messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 text-sm ${msg.isHuman ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  msg.isModerator ? 'bg-slate-600 text-slate-200' :
                  msg.isHuman ? 'bg-cyan-800 text-cyan-300' : 'bg-indigo-800 text-indigo-200'}`}>
                  {msg.isModerator ? 'M' : msg.speakerName[0]}
                </div>
                <div className={`flex-1 ${msg.isHuman ? 'items-end' : ''} flex flex-col`}>
                  <div className={`text-[10px] font-medium mb-0.5 ${msg.isHuman ? 'text-right' : ''} ${
                    msg.isModerator ? 'text-slate-400' : msg.isHuman ? 'text-cyan-400' : 'text-indigo-400'}`}>
                    {msg.speakerName}
                  </div>
                  <div className={`inline-block text-left px-3 py-2 rounded-lg text-slate-200 text-xs leading-relaxed max-w-sm ${
                    msg.isModerator ? 'bg-slate-700/60' : msg.isHuman ? 'bg-cyan-900/40 self-end' : 'bg-slate-800/70'}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <button onClick={() => router.push('/')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors">
          Start Another Discussion
        </button>
      </div>
    </div>
  );
}
