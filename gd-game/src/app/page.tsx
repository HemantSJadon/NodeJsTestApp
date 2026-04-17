'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import type { RoomSummary, PanelType } from '@/types/game';
import { PRESET_TOPICS } from '@/lib/topics-client';

let _socket: Socket | null = null;
function getSocket(): Socket {
  if (!_socket || _socket.disconnected) _socket = io({ transports: ['websocket', 'polling'] });
  return _socket;
}

const PHASE_BADGES: Record<string, { label: string; cls: string }> = {
  lobby:              { label: 'Waiting',     cls: 'bg-slate-600/20 text-slate-400' },
  intro:              { label: 'Starting',    cls: 'bg-blue-500/20 text-blue-400' },
  thinking:           { label: 'Think Time',  cls: 'bg-indigo-500/20 text-indigo-400' },
  discussion:         { label: '🔴 Live',      cls: 'bg-red-500/20 text-red-400 animate-pulse' },
  closing:            { label: 'Closing',     cls: 'bg-amber-500/20 text-amber-400' },
  'generating-review':{ label: 'Reviewing',   cls: 'bg-purple-500/20 text-purple-400' },
  review:             { label: 'Completed',   cls: 'bg-slate-500/20 text-slate-400' },
};

const PANEL_STYLE: Record<PanelType, string> = {
  collaborative: 'text-emerald-400 bg-emerald-400/10',
  competitive:   'text-amber-400 bg-amber-400/10',
  hostile:       'text-red-400 bg-red-400/10',
  mixed:         'text-indigo-400 bg-indigo-400/10',
};

export default function HomePage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [connected, setConnected] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const createTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
  const [humanName, setHumanName] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [panelType, setPanelType] = useState<PanelType>('mixed');
  const [candidateCount, setCandidateCount] = useState(5);
  const [duration, setDuration] = useState(10);

  // Join modal state
  const [joinRoomId, setJoinRoomId] = useState<string | null>(null);
  const [joinName, setJoinName] = useState('');

  const resetForm = () => {
    setHumanName(''); setUseCustom(false); setTopic(''); setCustomTopic('');
    setPanelType('mixed'); setCandidateCount(5); setDuration(10); setCreateError('');
  };

  useEffect(() => {
    const s = getSocket();

    const onConnect = () => {
      setConnected(true);
      s.emit('get-rooms', (res: { rooms: RoomSummary[] }) => setRooms(res.rooms || []));
    };

    s.on('connect', onConnect);
    s.on('disconnect', () => setConnected(false));
    s.on('rooms-updated', (res: { rooms: RoomSummary[] }) => setRooms(res.rooms || []));

    if (s.connected) onConnect();

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect');
      s.off('rooms-updated');
    };
  }, []);

  const handleCreate = useCallback(() => {
    const finalTopic = useCustom ? customTopic.trim() : topic.trim();
    if (!finalTopic) return setCreateError('Please select or enter a topic.');
    if (!humanName.trim()) return setCreateError('Please enter your name.');
    if (creating) return;

    setCreating(true);
    setCreateError('');

    // Timeout guard — if server doesn't respond in 12s show error
    createTimeoutRef.current = setTimeout(() => {
      setCreating(false);
      setCreateError('Server did not respond. Check your connection and try again.');
    }, 12000);

    getSocket().emit('create-room', { topic: finalTopic, panelType, candidateCount, discussionDuration: duration },
      (res: { room?: { id: string }; error?: string }) => {
        clearTimeout(createTimeoutRef.current!);
        setCreating(false);
        if (res.error) { setCreateError(res.error); return; }
        if (res.room) {
          setShowCreate(false);
          resetForm();
          router.push(`/room/${res.room.id}?name=${encodeURIComponent(humanName.trim())}`);
        }
      }
    );
  }, [useCustom, customTopic, topic, humanName, panelType, candidateCount, duration, creating, router]);

  const handleJoin = useCallback(() => {
    if (!joinRoomId || !joinName.trim()) return;
    const id = joinRoomId;
    setJoinRoomId(null);
    setJoinName('');
    router.push(`/room/${id}?name=${encodeURIComponent(joinName.trim())}`);
  }, [joinRoomId, joinName, router]);

  return (
    <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className={`inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border text-xs font-medium ${
          connected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`} />
          {connected ? 'Connected' : 'Connecting…'}
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">MBA GD Simulator</h1>
        <p className="text-slate-400 max-w-lg mx-auto">
          Practice group discussions with AI candidates. Get evaluated by an AI panel — just like IIM/ISB selection rounds.
        </p>
        <button onClick={() => setShowCreate(true)}
          className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-500/20">
          + Create New Room
        </button>
      </div>

      {/* Room list */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          {rooms.length > 0 ? `Active Rooms (${rooms.length})` : 'No Active Rooms'}
        </h2>
        {rooms.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4 opacity-30">🎓</div>
            <p className="text-slate-500">Create your first discussion room to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => {
              const badge = PHASE_BADGES[room.phase] || PHASE_BADGES['lobby'];
              const isDone = room.phase === 'review';
              return (
                <div key={room.id}
                  className="glass-card p-5 cursor-pointer hover:border-indigo-500/30 transition-all group"
                  onClick={() => isDone ? router.push(`/review/${room.id}`) : setJoinRoomId(room.id)}>
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PANEL_STYLE[room.panelType]}`}>
                      {room.panelType}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-3 line-clamp-2 group-hover:text-indigo-300 transition-colors text-sm leading-snug">
                    {room.topic}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>👥 {room.candidateCount + 1} participants</span>
                    <span>⏱ {Math.round(room.discussionDuration / 60000)} min</span>
                  </div>
                  <div className="mt-3 text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isDone ? 'View results →' : 'Join room →'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Join Modal */}
      {joinRoomId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-white mb-4">Join Discussion Room</h2>
            <label className="block text-sm text-slate-300 mb-2">Your Name</label>
            <input type="text" value={joinName} onChange={(e) => setJoinName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="e.g. Rahul Verma" autoFocus
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setJoinRoomId(null); setJoinName(''); }}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleJoin} disabled={!joinName.trim()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors">
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Create Discussion Room</h2>
              <button onClick={() => { setShowCreate(false); resetForm(); }}
                className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/20 rounded-lg text-sm text-red-300">
                {createError}
              </div>
            )}

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Your Name *</label>
              <input type="text" value={humanName} onChange={(e) => setHumanName(e.target.value)}
                placeholder="e.g. Priya Mehta"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>

            {/* Topic */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Discussion Topic *</label>
              <div className="flex gap-2 mb-2">
                {[false, true].map((isCustom) => (
                  <button key={String(isCustom)} onClick={() => setUseCustom(isCustom)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${useCustom === isCustom ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                    {isCustom ? 'Custom' : 'Preset topics'}
                  </button>
                ))}
              </div>
              {useCustom ? (
                <textarea value={customTopic} onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Type your topic…" rows={2}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none" />
              ) : (
                <select value={topic} onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500">
                  <option value="">Select a topic…</option>
                  {PRESET_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              )}
            </div>

            {/* Panel type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Panel Dynamics</label>
              <div className="grid grid-cols-2 gap-2">
                {(['mixed', 'collaborative', 'competitive', 'hostile'] as PanelType[]).map((pt) => (
                  <button key={pt} onClick={() => setPanelType(pt)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      panelType === pt ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 bg-slate-800 hover:border-slate-500'}`}>
                    <div className="font-medium text-sm capitalize text-white">{pt}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {{ mixed: 'Realistic balance', collaborative: 'Supportive & constructive', competitive: 'Everyone vies to impress', hostile: 'Aggressive, charged dynamics' }[pt]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Candidates */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                AI Candidates: <span className="text-indigo-400">{candidateCount}</span>
              </label>
              <input type="range" min={3} max={7} value={candidateCount}
                onChange={(e) => setCandidateCount(Number(e.target.value))}
                className="w-full accent-indigo-500" />
              <div className="flex justify-between text-xs text-slate-500 mt-1"><span>3</span><span>7</span></div>
            </div>

            {/* Duration */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Duration: <span className="text-indigo-400">{duration} min</span>
              </label>
              <div className="flex gap-2">
                {[5, 8, 10, 12, 15].map((d) => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      duration === d ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleCreate} disabled={creating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors">
              {creating ? 'Creating…' : 'Start Discussion Room'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
