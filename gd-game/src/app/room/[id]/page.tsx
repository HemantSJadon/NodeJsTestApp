'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import type { Room, Message, Phase, Candidate } from '@/types/game';

let socket: Socket;
function getSocket() {
  if (!socket) socket = io({ transports: ['websocket', 'polling'] });
  return socket;
}

// Positions for candidates in a circle layout (as % of container)
function getCirclePositions(count: number) {
  const positions = [];
  // Moderator at top-center
  positions.push({ x: 50, y: 8, label: 'moderator' });

  // Candidates arranged in a semi-circle below
  for (let i = 0; i < count; i++) {
    const angle = Math.PI + (Math.PI * i) / (count - 1 || 1) - Math.PI;
    const startAngle = -0.65 * Math.PI;
    const endAngle = -0.35 * Math.PI;
    const a = startAngle + ((endAngle - startAngle) * i) / Math.max(count - 1, 1);

    // Spread candidates across the middle area
    const radiusX = 40;
    const radiusY = 30;
    const cx = 50 + radiusX * Math.cos(a + Math.PI * 0.5);
    const cy = 45 + radiusY * Math.sin(a + Math.PI * 0.5);
    positions.push({ x: cx, y: cy });
  }

  // Human at bottom center
  positions.push({ x: 50, y: 82, label: 'human' });
  return positions;
}

function WaveBars() {
  return (
    <div className="flex items-end gap-0.5 h-5">
      {[...Array(5)].map((_, i) => (
        <span key={i} className="wave-bar" />
      ))}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="thinking-dots flex gap-1">
      <span /><span /><span />
    </div>
  );
}

function CandidateAvatar({
  name,
  color,
  isSpeaking,
  isHuman,
  isModerator,
  speakingCount,
  personality,
}: {
  name: string;
  color: string;
  isSpeaking: boolean;
  isHuman?: boolean;
  isModerator?: boolean;
  speakingCount?: number;
  personality?: string;
}) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const borderColor = isModerator ? '#94A3B8' : isHuman ? '#22D3EE' : color;

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      <div className="relative">
        {isSpeaking && (
          <div
            className="absolute inset-0 rounded-full speaking-ring"
            style={{ borderColor }}
          />
        )}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 transition-all duration-200 ${isSpeaking ? 'scale-105' : ''}`}
          style={{
            backgroundColor: isModerator ? '#374151' : isHuman ? '#0E7490' : color,
            borderColor: isSpeaking ? borderColor : 'transparent',
          }}
        >
          {isModerator ? '🎓' : isHuman ? '🎤' : initials}
        </div>
        {isSpeaking && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
            <WaveBars />
          </div>
        )}
      </div>
      <div className="text-center mt-1" style={{ minWidth: 70 }}>
        <div className="text-xs font-semibold text-white leading-tight">
          {isModerator ? 'Moderator' : name.split(' ')[0]}
        </div>
        {!isModerator && !isHuman && personality && (
          <div className="text-[10px] text-slate-500 capitalize leading-tight">{personality.replace('_', ' ')}</div>
        )}
        {isHuman && (
          <div className="text-[10px] text-cyan-400 leading-tight">YOU</div>
        )}
      </div>
    </div>
  );
}

function PhaseOverlay({ phase, thinkSeconds }: { phase: Phase; thinkSeconds: number }) {
  if (phase === 'lobby') {
    return (
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
        <div className="text-6xl mb-4">🎓</div>
        <h2 className="text-2xl font-bold text-white mb-2">Ready to begin?</h2>
        <p className="text-slate-400 mb-6 text-center max-w-xs">
          The discussion will start once you click the button below. Ensure your microphone is ready.
        </p>
      </div>
    );
  }

  if (phase === 'thinking') {
    const m = Math.floor(thinkSeconds / 60);
    const s = thinkSeconds % 60;
    return (
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
        <div className="text-5xl mb-4">🧠</div>
        <h2 className="text-xl font-bold text-white mb-1">Think Time</h2>
        <p className="text-slate-400 mb-4 text-sm">Jot down your thoughts before the discussion</p>
        <div className="text-5xl font-mono font-bold text-indigo-400">
          {m}:{s.toString().padStart(2, '0')}
        </div>
      </div>
    );
  }

  if (phase === 'generating-review') {
    return (
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
        <div className="text-5xl mb-4 animate-spin">⚙️</div>
        <h2 className="text-xl font-bold text-white mb-2">Generating Reviews</h2>
        <p className="text-slate-400 text-sm">Our AI panel is evaluating all participants...</p>
      </div>
    );
  }

  return null;
}

export default function RoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const humanName = searchParams.get('name') || 'You';

  const [room, setRoom] = useState<Room | null>(null);
  const [phase, setPhase] = useState<Phase>('lobby');
  const [messages, setMessages] = useState<Message[]>([]);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isHumanSpeaking, setIsHumanSpeaking] = useState(false);
  const [thinkSeconds, setThinkSeconds] = useState(120);
  const [discussionRemaining, setDiscussionRemaining] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [humanOpportunity, setHumanOpportunity] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [pttActive, setPttActive] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [humanClosingMode, setHumanClosingMode] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [notes, setNotes] = useState('');

  const transcriptRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const speakingQueueRef = useRef<boolean>(false);
  const thinkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const discussionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  // Load voices
  useEffect(() => {
    if (typeof window === 'undefined') return;
    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices().filter(
        (v) => v.lang.startsWith('en')
      );
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setSpeechSupported(false);
    }
  }, []);

  const speakText = useCallback(
    (text: string, voiceIndex: number, onDone?: () => void) => {
      if (!synthRef.current) {
        onDone?.();
        return;
      }

      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Assign different voices
      const voices = voicesRef.current;
      if (voices.length > 0) {
        const idx = voiceIndex % voices.length;
        utterance.voice = voices[idx];
      }

      utterance.rate = voiceIndex === 0 ? 0.92 : 0.88 + voiceIndex * 0.02;
      utterance.pitch = 0.95 + (voiceIndex % 3) * 0.1;
      utterance.volume = 1;

      utterance.onend = () => {
        speakingQueueRef.current = false;
        onDone?.();
      };
      utterance.onerror = () => {
        speakingQueueRef.current = false;
        onDone?.();
      };

      speakingQueueRef.current = true;
      synthRef.current.speak(utterance);
    },
    []
  );

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    speakingQueueRef.current = false;
  }, []);

  // Socket setup
  useEffect(() => {
    const s = getSocket();

    s.on('connect', () => {
      s.emit('join-room', { roomId, humanName }, (res: { room?: Room; error?: string }) => {
        if (res.error) {
          alert(res.error);
          router.push('/');
          return;
        }
        if (res.room) {
          setRoom(res.room);
          setPhase(res.room.phase);
          setMessages(res.room.messages || []);
        }
      });
    });

    s.emit('join-room', { roomId, humanName }, (res: { room?: Room; error?: string }) => {
      if (res.error) { router.push('/'); return; }
      if (res.room) {
        setRoom(res.room);
        setPhase(res.room.phase);
        setMessages(res.room.messages || []);
      }
    });

    s.on('phase-change', ({ phase: newPhase, duration }: { phase: Phase; duration?: number }) => {
      setPhase(newPhase);

      if (newPhase === 'thinking' && duration) {
        setThinkSeconds(Math.floor(duration / 1000));
        thinkTimerRef.current = setInterval(() => {
          setThinkSeconds((prev) => {
            if (prev <= 1) {
              clearInterval(thinkTimerRef.current!);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      if (newPhase === 'discussion' && duration) {
        setDiscussionRemaining(duration);
        discussionTimerRef.current = setInterval(() => {
          setDiscussionRemaining((prev) => Math.max(0, prev - 1000));
        }, 1000);
      }

      if (newPhase === 'review') {
        clearInterval(discussionTimerRef.current!);
      }
    });

    s.on('ai-speaking', ({ speakerId, speakerName, text, isModerator, voiceIndex, messageId }: {
      speakerId: string; speakerName: string; text: string; isModerator?: boolean; voiceIndex: number; messageId: string;
    }) => {
      setSpeakingId(speakerId);
      setStatusText(`${speakerName} is speaking...`);
      speakText(text, voiceIndex, () => {
        setSpeakingId(null);
        setStatusText('');
      });
    });

    s.on('message-added', (msg: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    s.on('human-turn-opportunity', () => {
      setHumanOpportunity(true);
      setTimeout(() => setHumanOpportunity(false), 4000);
    });

    s.on('awaiting-human-closing', () => {
      setHumanClosingMode(true);
      setStatusText('Your turn — give your closing statement');
    });

    s.on('human-speaking', () => {
      stopSpeaking();
    });

    s.on('reviews-ready', ({ roomId: rid }: { roomId: string }) => {
      setTimeout(() => router.push(`/review/${rid}?name=${encodeURIComponent(humanName)}`), 1500);
    });

    s.on('game-error', ({ message }: { message: string }) => {
      alert(message);
    });

    return () => {
      s.off('phase-change');
      s.off('ai-speaking');
      s.off('message-added');
      s.off('human-turn-opportunity');
      s.off('awaiting-human-closing');
      s.off('human-speaking');
      s.off('reviews-ready');
      s.off('game-error');
      clearInterval(thinkTimerRef.current!);
      clearInterval(discussionTimerRef.current!);
    };
  }, [roomId, humanName, router, speakText, stopSpeaking]);

  const handleStartGame = () => {
    if (gameStarted) return;
    setGameStarted(true);
    getSocket().emit('start-game', { roomId });
    setPhase('intro');
  };

  // Push-to-talk handlers
  const startPTT = useCallback(() => {
    if (!speechSupported || pttActive) return;
    stopSpeaking();
    setPttActive(true);
    setIsHumanSpeaking(true);
    setHumanOpportunity(false);
    getSocket().emit('human-interrupt', { roomId });

    const SR = (window.SpeechRecognition || (window as any).webkitSpeechRecognition) as typeof SpeechRecognition;
    recognitionRef.current = new SR();
    recognitionRef.current.lang = 'en-IN';
    recognitionRef.current.interimResults = true;
    recognitionRef.current.continuous = false;

    let finalTranscript = '';

    recognitionRef.current.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setStatusText(`Listening: ${finalTranscript}${interim}`);
    };

    recognitionRef.current.onend = () => {
      if (finalTranscript.trim()) {
        getSocket().emit('human-speech', { roomId, text: finalTranscript.trim() });
        if (humanClosingMode) {
          getSocket().emit('human-closing-done', { roomId });
          setHumanClosingMode(false);
        }
      }
      getSocket().emit('human-done-speaking', { roomId });
      setPttActive(false);
      setIsHumanSpeaking(false);
      setStatusText('');
    };

    recognitionRef.current.onerror = () => {
      setPttActive(false);
      setIsHumanSpeaking(false);
      setStatusText('');
      getSocket().emit('human-done-speaking', { roomId });
    };

    recognitionRef.current.start();
  }, [speechSupported, pttActive, stopSpeaking, roomId, humanClosingMode]);

  const stopPTT = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  // Text fallback for non-speech
  const [textInput, setTextInput] = useState('');
  const submitTextInput = () => {
    if (!textInput.trim()) return;
    getSocket().emit('human-speech', { roomId, text: textInput.trim() });
    if (humanClosingMode) {
      getSocket().emit('human-closing-done', { roomId });
      setHumanClosingMode(false);
    }
    getSocket().emit('human-done-speaking', { roomId });
    setTextInput('');
    setStatusText('');
  };

  const formatTime = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Joining room...</div>
      </div>
    );
  }

  const positions = getCirclePositions(room.candidates.length);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white text-sm">← Back</button>
          <div className="w-px h-4 bg-slate-700" />
          <div className="text-sm font-medium text-white truncate max-w-xs" title={room.topic}>
            {room.topic}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
            room.panelType === 'collaborative' ? 'bg-emerald-500/15 text-emerald-400' :
            room.panelType === 'competitive' ? 'bg-amber-500/15 text-amber-400' :
            room.panelType === 'hostile' ? 'bg-red-500/15 text-red-400' :
            'bg-indigo-500/15 text-indigo-400'
          }`}>
            {room.panelType}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {phase === 'discussion' && (
            <div className={`font-mono text-sm font-bold ${discussionRemaining < 60000 ? 'text-red-400' : 'text-indigo-400'}`}>
              ⏱ {formatTime(discussionRemaining)}
            </div>
          )}
          <button
            onClick={() => setShowTranscript((v) => !v)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
          >
            {showTranscript ? 'Hide' : 'Show'} Transcript
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main arena */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Discussion circle */}
          <div className="flex-1 relative p-4" style={{ minHeight: 380 }}>
            <div className="relative w-full h-full" style={{ minHeight: 350 }}>
              {/* Phase overlay */}
              <div className="relative w-full h-full">
                {/* Moderator */}
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ left: `${positions[0].x}%`, top: `${positions[0].y}%` }}
                >
                  <CandidateAvatar
                    name="Moderator"
                    color="#6B7280"
                    isSpeaking={speakingId === 'moderator'}
                    isModerator
                  />
                </div>

                {/* AI Candidates */}
                {room.candidates.map((candidate, i) => (
                  <div
                    key={candidate.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{ left: `${positions[i + 1].x}%`, top: `${positions[i + 1].y}%` }}
                  >
                    <CandidateAvatar
                      name={candidate.name}
                      color={candidate.avatarColor}
                      isSpeaking={speakingId === candidate.id}
                      personality={candidate.personality}
                      speakingCount={candidate.speakingCount}
                    />
                  </div>
                ))}

                {/* Human (you) */}
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ left: `${positions[positions.length - 1].x}%`, top: `${positions[positions.length - 1].y}%` }}
                >
                  <CandidateAvatar
                    name={humanName}
                    color="#0E7490"
                    isSpeaking={isHumanSpeaking}
                    isHuman
                  />
                </div>

                {/* Phase overlays */}
                {(phase === 'lobby' || phase === 'generating-review') && (
                  <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-20">
                    {phase === 'lobby' ? (
                      <>
                        <div className="text-5xl mb-4">🎓</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Ready to begin?</h2>
                        <p className="text-slate-400 mb-6 text-center max-w-xs text-sm">
                          Your AI panel is assembled. Ensure your microphone is ready.
                        </p>
                        <button
                          onClick={handleStartGame}
                          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-base transition-colors shadow-lg"
                        >
                          Start Discussion
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="text-5xl mb-4 animate-pulse">⚙️</div>
                        <h2 className="text-xl font-bold text-white mb-2">Generating Reviews</h2>
                        <p className="text-slate-400 text-sm">AI panel is evaluating all participants...</p>
                      </>
                    )}
                  </div>
                )}

                {phase === 'thinking' && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-20">
                    <div className="text-5xl mb-4">🧠</div>
                    <h2 className="text-xl font-bold text-white mb-1">Think Time</h2>
                    <p className="text-slate-400 mb-4 text-sm">Organize your thoughts before speaking</p>
                    <div className="text-6xl font-mono font-bold text-indigo-400 mb-6">
                      {Math.floor(thinkSeconds / 60)}:{(thinkSeconds % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="w-full max-w-sm">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Jot down your key points here..."
                        rows={4}
                        className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status / Controls bar */}
          <div className="border-t border-white/5 bg-slate-900/50 p-4">
            {/* Status text */}
            {statusText && (
              <div className="text-center text-sm text-slate-400 mb-3 animate-pulse">
                {statusText}
              </div>
            )}

            {/* Human opportunity indicator */}
            {humanOpportunity && !pttActive && phase === 'discussion' && (
              <div className="text-center text-sm text-cyan-400 mb-3 animate-pulse font-medium">
                💬 Your turn to speak — press and hold the button below
              </div>
            )}

            {/* Human closing mode */}
            {humanClosingMode && (
              <div className="text-center text-sm text-indigo-400 mb-3 font-medium">
                🎤 Please give your closing statement
              </div>
            )}

            {/* PTT or Text input */}
            {(phase === 'discussion' || phase === 'closing' || humanClosingMode) && (
              <div className="flex items-center justify-center gap-4">
                {speechSupported ? (
                  <button
                    className={`ptt-button px-8 py-3 rounded-xl font-semibold text-sm transition-all select-none ${
                      pttActive
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-95'
                        : humanOpportunity || humanClosingMode
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 animate-pulse'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                    onMouseDown={startPTT}
                    onMouseUp={stopPTT}
                    onTouchStart={(e) => { e.preventDefault(); startPTT(); }}
                    onTouchEnd={(e) => { e.preventDefault(); stopPTT(); }}
                  >
                    {pttActive ? '🔴 Recording... (release to send)' : '🎤 Hold to Speak'}
                  </button>
                ) : (
                  <div className="flex gap-2 w-full max-w-md">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitTextInput()}
                      placeholder="Type your contribution and press Enter..."
                      className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                    />
                    <button
                      onClick={submitTextInput}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            )}

            {phase === 'thinking' && (
              <div className="text-center text-slate-500 text-sm">
                Discussion begins after think time ends
              </div>
            )}

            {phase === 'intro' && (
              <div className="text-center flex items-center justify-center gap-2">
                <ThinkingDots />
                <span className="text-slate-400 text-sm ml-2">Moderator is introducing the topic...</span>
              </div>
            )}
          </div>
        </div>

        {/* Transcript sidebar */}
        {showTranscript && (
          <div className="w-72 border-l border-white/5 bg-slate-900/30 flex flex-col">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300">Transcript</span>
              <span className="text-xs text-slate-500">{messages.length} messages</span>
            </div>
            <div
              ref={transcriptRef}
              className="flex-1 overflow-y-auto p-3 space-y-3 transcript-scroll"
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`text-xs rounded-lg p-2.5 ${
                  msg.isModerator
                    ? 'bg-slate-700/50 border border-slate-600/30'
                    : msg.isHuman
                    ? 'bg-cyan-900/30 border border-cyan-700/20 ml-2'
                    : 'bg-slate-800/50'
                }`}>
                  <div className={`font-semibold mb-1 ${
                    msg.isModerator ? 'text-slate-300' : msg.isHuman ? 'text-cyan-400' : 'text-indigo-300'
                  }`}>
                    {msg.speakerName}
                    {speakingId === msg.speakerId && !msg.isHuman && (
                      <span className="ml-1 text-emerald-400">●</span>
                    )}
                  </div>
                  <div className="text-slate-300 leading-relaxed">{msg.text}</div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-slate-600 text-xs text-center pt-4">
                  Discussion transcript will appear here
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
