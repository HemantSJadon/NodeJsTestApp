'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import type { RoomSummary, PanelType } from '@/types/game';
import { PRESET_TOPICS } from '@/lib/topics-client';

let socket: Socket;

function getSocket() {
  if (!socket) {
    socket = io({ transports: ['websocket', 'polling'] });
  }
  return socket;
}

const PANEL_COLORS: Record<PanelType, string> = {
  collaborative: 'text-emerald-400 bg-emerald-400/10',
  competitive: 'text-amber-400 bg-amber-400/10',
  hostile: 'text-red-400 bg-red-400/10',
  mixed: 'text-indigo-400 bg-indigo-400/10',
};

const PHASE_LABELS: Record<string, string> = {
  lobby: 'Waiting',
  intro: 'Starting',
  thinking: 'Think Time',
  discussion: 'Live',
  closing: 'Closing',
  'generating-review': 'Reviewing',
  review: 'Completed',
};

export default function HomePage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [connected, setConnected] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create room form state
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [panelType, setPanelType] = useState<PanelType>('mixed');
  const [candidateCount, setCandidateCount] = useState(5);
  const [discussionDuration, setDiscussionDuration] = useState(10);
  const [humanName, setHumanName] = useState('');
  const [useCustomTopic, setUseCustomTopic] = useState(false);

  useEffect(() => {
    const s = getSocket();

    s.on('connect', () => {
      setConnected(true);
      s.emit('get-rooms', (res: { rooms: RoomSummary[] }) => {
        setRooms(res.rooms || []);
      });
    });

    s.on('disconnect', () => setConnected(false));

    s.on('rooms-updated', (res: { rooms: RoomSummary[] }) => {
      setRooms(res.rooms || []);
    });

    if (s.connected) {
      setConnected(true);
      s.emit('get-rooms', (res: { rooms: RoomSummary[] }) => {
        setRooms(res.rooms || []);
      });
    }

    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('rooms-updated');
    };
  }, []);

  const handleCreateRoom = useCallback(() => {
    const finalTopic = useCustomTopic ? customTopic.trim() : topic;
    if (!finalTopic) return alert('Please select or enter a topic');
    if (!humanName.trim()) return alert('Please enter your name');

    setCreating(true);
    const s = getSocket();
    s.emit(
      'create-room',
      { topic: finalTopic, panelType, candidateCount, discussionDuration },
      (res: { room?: { id: string }; error?: string }) => {
        setCreating(false);
        if (res.error) {
          alert(res.error);
          return;
        }
        if (res.room) {
          router.push(`/room/${res.room.id}?name=${encodeURIComponent(humanName.trim())}`);
        }
      }
    );
  }, [topic, customTopic, useCustomTopic, panelType, candidateCount, discussionDuration, humanName, router]);

  const handleJoinRoom = (roomId: string) => {
    const name = prompt('Enter your name for this session:');
    if (!name?.trim()) return;
    router.push(`/room/${roomId}?name=${encodeURIComponent(name.trim())}`);
  };

  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {connected ? 'Connected' : 'Connecting...'}
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          MBA GD Simulator
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-lg">
          Practice group discussions with AI candidates. Get evaluated like a real MBA panel.
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-base transition-colors shadow-lg shadow-indigo-500/20"
        >
          + Create New Discussion Room
        </button>
      </div>

      {/* Rooms grid */}
      <section>
        <h2 className="text-lg font-semibold text-slate-300 mb-4">
          {rooms.length > 0 ? `Active Rooms (${rooms.length})` : 'No Active Rooms'}
        </h2>
        {rooms.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-500">
            <div className="text-5xl mb-4">🎓</div>
            <p className="text-lg">Create your first discussion room to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="glass-card p-5 cursor-pointer hover:border-indigo-500/30 transition-all group"
                onClick={() => room.phase === 'review' ? router.push(`/review/${room.id}`) : handleJoinRoom(room.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PANEL_COLORS[room.panelType]}`}
                  >
                    {room.panelType}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      room.phase === 'discussion'
                        ? 'bg-red-500/20 text-red-400 animate-pulse'
                        : room.phase === 'review'
                        ? 'bg-slate-500/20 text-slate-400'
                        : 'bg-slate-600/20 text-slate-400'
                    }`}
                  >
                    {PHASE_LABELS[room.phase] || room.phase}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-indigo-300 transition-colors">
                  {room.topic}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>👥 {room.candidateCount + 1} participants</span>
                  <span>⏱ {Math.round(room.discussionDuration / 60000)} min</span>
                </div>
                {room.humanName && room.humanName !== 'You' && (
                  <div className="mt-2 text-xs text-slate-500">Host: {room.humanName}</div>
                )}
                <div className="mt-3 text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {room.phase === 'review' ? 'View results →' : 'Join room →'}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Room Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create Discussion Room</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Your name */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
              <input
                type="text"
                value={humanName}
                onChange={(e) => setHumanName(e.target.value)}
                placeholder="e.g. Rahul Verma"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Topic */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-300 mb-2">Discussion Topic</label>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setUseCustomTopic(false)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${!useCustomTopic ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                >
                  Preset topics
                </button>
                <button
                  onClick={() => setUseCustomTopic(true)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${useCustomTopic ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                >
                  Custom topic
                </button>
              </div>
              {useCustomTopic ? (
                <textarea
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Enter your discussion topic..."
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              ) : (
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select a topic...</option>
                  {PRESET_TOPICS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Panel type */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-300 mb-2">Panel Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['mixed', 'collaborative', 'competitive', 'hostile'] as PanelType[]).map((pt) => (
                  <button
                    key={pt}
                    onClick={() => setPanelType(pt)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      panelType === pt
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                    }`}
                  >
                    <div className="font-medium text-sm capitalize text-white">{pt}</div>
                    <div className="text-xs text-slate-400 mt-0.5 leading-snug">
                      {pt === 'mixed' && 'Realistic balance'}
                      {pt === 'collaborative' && 'Supportive & constructive'}
                      {pt === 'competitive' && 'Everyone vying to impress'}
                      {pt === 'hostile' && 'Aggressive dynamics'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Candidates */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                AI Candidates: <span className="text-indigo-400">{candidateCount}</span>
              </label>
              <input
                type="range"
                min={3}
                max={7}
                value={candidateCount}
                onChange={(e) => setCandidateCount(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>3</span><span>7</span>
              </div>
            </div>

            {/* Duration */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Discussion Duration: <span className="text-indigo-400">{discussionDuration} min</span>
              </label>
              <div className="flex gap-2">
                {[5, 8, 10, 12, 15].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiscussionDuration(d)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      discussionDuration === d
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={creating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
            >
              {creating ? 'Creating room...' : 'Start Discussion Room'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
