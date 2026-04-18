'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import type { Room, Message, Phase } from '@/types/game';

// One socket per browser tab — scoped to module, not window
let _socket: Socket | null = null;
function getSocket(): Socket {
  if (!_socket || _socket.disconnected) {
    _socket = io({ transports: ['websocket', 'polling'] });
  }
  return _socket;
}

// ── Circle layout math ────────────────────────────────────────────────────────
function getPositions(candidateCount: number) {
  // Moderator top-center, Human bottom-center, candidates evenly spread in arc
  const positions: Array<{ x: number; y: number; role: string }> = [];
  positions.push({ x: 50, y: 10, role: 'moderator' });

  if (candidateCount === 1) {
    positions.push({ x: 50, y: 45, role: 'candidate' });
  } else {
    // Spread candidates in an arc from left-center to right-center
    const startAngle = -0.72 * Math.PI;
    const endAngle = -0.28 * Math.PI;
    for (let i = 0; i < candidateCount; i++) {
      const t = candidateCount === 1 ? 0.5 : i / (candidateCount - 1);
      const angle = startAngle + t * (endAngle - startAngle);
      const rx = 42, ry = 32, cx = 50, cy = 50;
      positions.push({
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle),
        role: 'candidate',
      });
    }
  }
  positions.push({ x: 50, y: 84, role: 'human' });
  return positions;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function WaveBars() {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="wave-bar" style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </div>
  );
}

function ThinkDots() {
  return (
    <div className="thinking-dots flex gap-1 items-center">
      <span /><span /><span />
    </div>
  );
}

function Avatar({
  name, color, isSpeaking, isHuman, isModerator, personality,
}: {
  name: string; color: string; isSpeaking: boolean;
  isHuman?: boolean; isModerator?: boolean; personality?: string;
}) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const ring = isModerator ? '#94A3B8' : isHuman ? '#22D3EE' : color;

  return (
    <div className="flex flex-col items-center gap-1 select-none pointer-events-none" style={{ width: 80 }}>
      <div className="relative flex items-center justify-center">
        {isSpeaking && (
          <span
            className="absolute inset-0 rounded-full animate-[speakingPulse_1.3s_ease-out_infinite]"
            style={{ boxShadow: `0 0 0 0 ${ring}66` }}
          />
        )}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-transform duration-150"
          style={{
            background: isModerator ? '#374151' : isHuman ? '#0E7490' : color,
            borderColor: isSpeaking ? ring : 'transparent',
            transform: isSpeaking ? 'scale(1.08)' : 'scale(1)',
          }}
        >
          {isModerator ? '🎓' : isHuman ? '🎤' : initials}
        </div>
        {isSpeaking && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <WaveBars />
          </div>
        )}
      </div>
      <div className="text-center mt-1 px-1">
        <div className="text-xs font-semibold text-white leading-tight truncate w-full">
          {isModerator ? 'Moderator' : name.split(' ')[0]}
        </div>
        {isHuman && <div className="text-[10px] text-cyan-400">YOU</div>}
        {!isModerator && !isHuman && personality && (
          <div className="text-[10px] text-slate-500 capitalize leading-tight">
            {personality.replace('_', ' ')}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const humanName = (searchParams.get('name') || 'You').slice(0, 50);

  const [room, setRoom] = useState<Room | null>(null);
  const [phase, setPhase] = useState<Phase>('lobby');
  const [messages, setMessages] = useState<Message[]>([]);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isHumanSpeaking, setIsHumanSpeaking] = useState(false);
  const [thinkSecs, setThinkSecs] = useState(120);
  const [discRemaining, setDiscRemaining] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [pttActive, setPttActive] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [humanOpportunity, setHumanOpportunity] = useState(false);
  const [humanClosingMode, setHumanClosingMode] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [notes, setNotes] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [error, setError] = useState('');

  const transcriptRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentMsgIdRef = useRef<string | null>(null);
  const thinkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const discTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const oppTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const joinedRef = useRef(false); // prevent double-join

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  // Load TTS voices (async in some browsers)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices();
      voicesRef.current = all.filter((v) => v.lang.startsWith('en'));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    const SR = (window as typeof window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
      .SpeechRecognition ?? (window as typeof window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    setSpeechSupported(!!SR);

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Speak text and signal server when done
  const speakText = useCallback((text: string, voiceIndex: number, messageId: string, voiceGender?: string) => {
    const synth = synthRef.current;
    if (!synth) {
      getSocket().emit('utterance-complete', { messageId });
      return;
    }
    synth.cancel();

    const utt = new SpeechSynthesisUtterance(text);
    const voices = voicesRef.current;

    if (voices.length > 0) {
      // Try to find a gender-matched voice
      const femaleKeywords = ['female', 'woman', 'zira', 'samantha', 'karen', 'victoria', 'tessa', 'fiona', 'moira'];
      const maleKeywords = ['male', 'man', 'david', 'daniel', 'alex', 'mark', 'fred', 'tom', 'rishi'];
      const keywords = voiceGender === 'female' ? femaleKeywords : maleKeywords;
      const genderMatch = voices.find((v) => keywords.some((k) => v.name.toLowerCase().includes(k)));
      utt.voice = genderMatch ?? voices[voiceIndex % voices.length];
    }

    // Wide pitch/rate ranges so even a single voice engine sounds distinct per speaker
    const pitchSteps  = [0.70, 0.85, 1.00, 1.15, 1.30, 0.78, 0.92, 1.08, 1.22, 0.75];
    const rateSteps   = [0.82, 0.88, 0.94, 1.00, 0.80, 0.92, 0.86, 0.96, 0.84, 0.90];
    utt.pitch = pitchSteps[voiceIndex % pitchSteps.length];
    utt.rate  = rateSteps[voiceIndex % rateSteps.length];

    const done = () => {
      if (currentMsgIdRef.current === messageId) {
        currentMsgIdRef.current = null;
        setSpeakingId(null);
        setStatusText('');
        getSocket().emit('utterance-complete', { messageId });
      }
    };
    utt.onend = done;
    utt.onerror = done;

    currentUtteranceRef.current = utt;
    currentMsgIdRef.current = messageId;
    synth.speak(utt);
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    if (currentMsgIdRef.current) {
      getSocket().emit('utterance-complete', { messageId: currentMsgIdRef.current });
      currentMsgIdRef.current = null;
    }
    setSpeakingId(null);
    setStatusText('');
  }, []);

  // Socket setup — single join, proper cleanup
  useEffect(() => {
    const s = getSocket();

    const joinRoom = () => {
      if (joinedRef.current) return;
      joinedRef.current = true;
      s.emit('join-room', { roomId, humanName }, (res: { room?: Room; error?: string }) => {
        if (res.error) { setError(res.error); return; }
        if (res.room) {
          setRoom(res.room);
          setPhase(res.room.phase);
          setMessages(res.room.messages || []);
        }
      });
    };

    if (s.connected) {
      joinRoom();
    } else {
      s.once('connect', joinRoom);
    }

    s.on('phase-change', ({ phase: p, duration }: { phase: Phase; duration?: number }) => {
      setPhase(p);

      if (p === 'thinking' && duration) {
        setThinkSecs(Math.floor(duration / 1000));
        if (thinkTimerRef.current) clearInterval(thinkTimerRef.current);
        thinkTimerRef.current = setInterval(() => {
          setThinkSecs((prev) => {
            if (prev <= 1) { clearInterval(thinkTimerRef.current!); return 0; }
            return prev - 1;
          });
        }, 1000);
      }

      if (p === 'discussion' && duration) {
        setDiscRemaining(duration);
        if (discTimerRef.current) clearInterval(discTimerRef.current);
        discTimerRef.current = setInterval(() => {
          setDiscRemaining((prev) => Math.max(0, prev - 1000));
        }, 1000);
      }

      if (p === 'review' || p === 'generating-review') {
        if (discTimerRef.current) clearInterval(discTimerRef.current);
      }
    });

    s.on('ai-speaking', ({ speakerId, speakerName, text, voiceIndex, voiceGender, messageId }: {
      speakerId: string; speakerName: string; text: string;
      voiceIndex: number; voiceGender?: string; messageId: string; isModerator?: boolean;
    }) => {
      setSpeakingId(speakerId);
      setStatusText(`${speakerName} is speaking…`);
      speakText(text, voiceIndex, messageId, voiceGender);
    });

    s.on('message-added', (msg: Message) => {
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
    });

    s.on('human-turn-opportunity', () => {
      setHumanOpportunity(true);
      if (oppTimeoutRef.current) clearTimeout(oppTimeoutRef.current);
      oppTimeoutRef.current = setTimeout(() => setHumanOpportunity(false), 4500);
    });

    s.on('awaiting-human-closing', () => {
      setHumanClosingMode(true);
      setStatusText('Your turn — give your closing statement');
    });

    s.on('human-speaking', () => stopSpeaking());
    s.on('human-done', () => {});

    s.on('reviews-ready', ({ roomId: rid }: { roomId: string }) => {
      setTimeout(() => {
        router.push(`/review/${rid}?name=${encodeURIComponent(humanName)}`);
      }, 1200);
    });

    s.on('game-error', ({ message }: { message: string }) => {
      setError(message);
      setPhase('lobby');
      setGameStarted(false);
    });

    return () => {
      s.off('phase-change');
      s.off('ai-speaking');
      s.off('message-added');
      s.off('human-turn-opportunity');
      s.off('awaiting-human-closing');
      s.off('human-speaking');
      s.off('human-done');
      s.off('reviews-ready');
      s.off('game-error');
      s.off('connect', joinRoom);

      if (thinkTimerRef.current) clearInterval(thinkTimerRef.current);
      if (discTimerRef.current) clearInterval(discTimerRef.current);
      if (oppTimeoutRef.current) clearTimeout(oppTimeoutRef.current);

      stopSpeaking();
      s.emit('leave-room', { roomId });
    };
  }, [roomId, humanName, router, speakText, stopSpeaking]);

  const handleStartGame = () => {
    if (gameStarted) return;
    setGameStarted(true);
    setError('');
    getSocket().emit('start-game', { roomId });
    setPhase('intro');
  };

  // Push-to-talk
  const startPTT = useCallback(() => {
    if (pttActive) return;
    const SR = (window as typeof window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
      .SpeechRecognition ?? (window as typeof window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SR) return;

    stopSpeaking();
    setPttActive(true);
    setIsHumanSpeaking(true);
    setHumanOpportunity(false);
    getSocket().emit('human-interrupt', { roomId });

    let finalText = '';
    const rec = new (SR as new () => SpeechRecognition)();
    rec.lang = 'en-IN';
    rec.interimResults = true;
    rec.continuous = false;
    recognitionRef.current = rec;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      setStatusText(`🎤 ${finalText}${interim}`);
    };

    const finish = () => {
      const text = finalText.trim();
      if (text) {
        getSocket().emit('human-speech', { roomId, text });
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

    rec.onend = finish;
    rec.onerror = finish;
    rec.start();
  }, [pttActive, stopSpeaking, roomId, humanClosingMode]);

  const stopPTT = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const submitText = () => {
    const text = textInput.trim();
    if (!text) return;
    getSocket().emit('human-speech', { roomId, text });
    if (humanClosingMode) {
      getSocket().emit('human-closing-done', { roomId });
      setHumanClosingMode(false);
    }
    getSocket().emit('human-done-speaking', { roomId });
    setTextInput('');
    setStatusText('');
  };

  const fmtTime = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (error && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Unable to join room</h2>
          <p className="text-slate-400 mb-6 text-sm">{error}</p>
          <button onClick={() => router.push('/')} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Connecting to room…</div>
      </div>
    );
  }

  const positions = getPositions(room.candidates.length);
  const isActivePhase = phase === 'discussion' || phase === 'closing';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0F172A' }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 bg-slate-900/60 backdrop-blur-sm shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white text-sm shrink-0">← Back</button>
          <div className="w-px h-4 bg-slate-700 shrink-0" />
          <p className="text-xs md:text-sm font-medium text-white truncate">{room.topic}</p>
          <span className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded-full capitalize font-medium shrink-0 ${
            room.panelType === 'collaborative' ? 'bg-emerald-500/15 text-emerald-400' :
            room.panelType === 'competitive' ? 'bg-amber-500/15 text-amber-400' :
            room.panelType === 'hostile' ? 'bg-red-500/15 text-red-400' :
            'bg-indigo-500/15 text-indigo-400'}`}>
            {room.panelType}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {phase === 'discussion' && (
            <span className={`font-mono text-xs md:text-sm font-bold ${discRemaining < 60000 ? 'text-red-400 animate-pulse' : 'text-indigo-300'}`}>
              ⏱ {fmtTime(discRemaining)}
            </span>
          )}
          <button onClick={() => setShowTranscript((v) => !v)}
            className="relative text-xs px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">
            {showTranscript ? 'Hide' : 'Transcript'}
            {!showTranscript && messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                {messages.length > 99 ? '9+' : messages.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-900/30 border-b border-red-500/20 px-4 py-2 text-sm text-red-300 text-center">
          {error}
          <button onClick={() => setError('')} className="ml-3 underline">dismiss</button>
        </div>
      )}

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
        {/* Arena — full width on mobile, flex-1 on desktop */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Avatar canvas: padding-bottom trick gives stable height on all screen sizes */}
          <div className="relative flex-1" style={{ minHeight: 260 }}>
            <div className="absolute inset-0 p-2">

              {/* Candidate avatars */}
              {positions.slice(1, -1).map((pos, i) => {
                const c = room.candidates[i];
                if (!c) return null;
                return (
                  <div key={c.id} className="absolute z-10"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}>
                    <Avatar name={c.name} color={c.avatarColor} isSpeaking={speakingId === c.id}
                      personality={c.personality} />
                  </div>
                );
              })}

              {/* Moderator */}
              <div className="absolute z-10"
                style={{ left: `${positions[0].x}%`, top: `${positions[0].y}%`, transform: 'translate(-50%, -50%)' }}>
                <Avatar name="Moderator" color="#6B7280" isSpeaking={speakingId === 'moderator'} isModerator />
              </div>

              {/* Human */}
              <div className="absolute z-10"
                style={{ left: `${positions[positions.length - 1].x}%`, top: `${positions[positions.length - 1].y}%`, transform: 'translate(-50%, -50%)' }}>
                <Avatar name={humanName} color="#0E7490" isSpeaking={isHumanSpeaking} isHuman />
              </div>

              {/* Phase overlays */}
              {phase === 'lobby' && (
                <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-20 p-6">
                  <div className="text-5xl mb-4">🎓</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Ready to begin?</h2>
                  <p className="text-slate-400 mb-2 text-center text-sm max-w-xs">
                    Your AI panel is assembled. Make sure your microphone is allowed in the browser.
                  </p>
                  <p className="text-slate-500 mb-6 text-center text-xs max-w-xs">
                    {room.candidates.length} AI candidates · {Math.round(room.discussionDuration / 60000)} min discussion · {room.panelType} panel
                  </p>
                  <button onClick={handleStartGame}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-base transition-colors shadow-lg shadow-indigo-500/25">
                    Start Discussion
                  </button>
                </div>
              )}

              {phase === 'thinking' && (
                <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm rounded-2xl flex items-start md:items-center justify-center z-20 overflow-y-auto py-4">
                  <div className="w-full max-w-sm mx-4 bg-slate-800/90 border border-slate-700/50 rounded-2xl p-5">
                    <div className="text-center mb-3">
                      <div className="text-3xl mb-1">🧠</div>
                      <h2 className="text-base font-bold text-white">Think Time</h2>
                      <p className="text-slate-400 text-xs mt-0.5">Organise your thoughts before the discussion</p>
                    </div>
                    <div className="text-4xl font-mono font-bold text-indigo-400 text-center mb-4">
                      {Math.floor(thinkSecs / 60)}:{(thinkSecs % 60).toString().padStart(2, '0')}
                    </div>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="Jot down key points, examples, counterarguments…"
                      rows={4}
                      className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-3 py-2.5 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 resize-none" />
                    <button
                      onClick={() => getSocket().emit('skip-thinking', { roomId })}
                      className="mt-3 w-full text-xs text-slate-500 hover:text-slate-300 underline transition-colors text-center">
                      Skip think time →
                    </button>
                  </div>
                </div>
              )}

              {phase === 'generating-review' && (
                <div className="absolute inset-0 bg-slate-900/88 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-20">
                  <div className="text-4xl mb-3 animate-spin">⚙️</div>
                  <h2 className="text-lg font-bold text-white mb-1">Generating Evaluations</h2>
                  <p className="text-slate-400 text-sm">AI panel is reviewing all participants…</p>
                </div>
              )}
            </div>
          </div>

          {/* Controls bar */}
          <div className="border-t border-white/5 bg-slate-900/50 p-3 shrink-0">
            {statusText && (
              <p className="text-center text-xs text-slate-400 mb-2 animate-pulse truncate">{statusText}</p>
            )}
            {humanOpportunity && !pttActive && isActivePhase && (
              <p className="text-center text-xs text-cyan-400 mb-2 font-medium animate-pulse">
                💬 Your turn to speak
              </p>
            )}
            {humanClosingMode && (
              <p className="text-center text-xs text-indigo-300 mb-2 font-medium">
                🎤 Give your closing statement
              </p>
            )}

            {isActivePhase && (
              speechSupported ? (
                <div className="flex justify-center">
                  <button
                    className={`ptt-button px-8 py-3 rounded-xl font-semibold text-sm transition-all select-none touch-none ${
                      pttActive ? 'bg-red-500 text-white shadow-red-500/30 shadow-lg scale-95' :
                      (humanOpportunity || humanClosingMode) ? 'bg-indigo-600 text-white shadow-indigo-500/30 shadow-lg animate-pulse' :
                      'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    onMouseDown={startPTT} onMouseUp={stopPTT}
                    onTouchStart={(e) => { e.preventDefault(); startPTT(); }}
                    onTouchEnd={(e) => { e.preventDefault(); stopPTT(); }}
                  >
                    {pttActive ? '🔴 Recording… (release to send)' : '🎤 Hold to Speak'}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 max-w-md mx-auto">
                  <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitText()}
                    placeholder="Type your contribution and press Enter…"
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500" />
                  <button onClick={submitText}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
                    Send
                  </button>
                </div>
              )
            )}

            {phase === 'thinking' && (
              <p className="text-center text-xs text-slate-500">Use the panel above to jot notes</p>
            )}
            {(phase === 'intro') && (
              <div className="flex items-center justify-center gap-2">
                <ThinkDots />
                <span className="text-xs text-slate-500 ml-1">Moderator is speaking…</span>
              </div>
            )}
          </div>
        </div>

        {/* Transcript — fixed overlay on mobile, side panel on desktop */}
        {showTranscript && (
          <div className="fixed inset-x-0 bottom-0 top-12 z-50 md:relative md:inset-auto md:top-auto md:z-auto md:w-72 border-l border-white/5 bg-slate-900 md:bg-slate-900/30 flex flex-col shrink-0">
            <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-slate-300">Live Transcript</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-600">{messages.length} messages</span>
                <button onClick={() => setShowTranscript(false)}
                  className="text-slate-500 hover:text-white text-lg leading-none md:hidden">×</button>
              </div>
            </div>
            <div ref={transcriptRef} className="flex-1 overflow-y-auto p-2 space-y-2 transcript-scroll min-h-0">
              {messages.map((msg) => (
                <div key={msg.id} className={`text-xs rounded-lg p-2 ${
                  msg.isModerator ? 'bg-slate-700/50 border border-slate-600/20' :
                  msg.isHuman ? 'bg-cyan-900/30 border border-cyan-700/20' : 'bg-slate-800/60'}`}>
                  <div className={`font-semibold mb-0.5 flex items-center gap-1 ${
                    msg.isModerator ? 'text-slate-300' : msg.isHuman ? 'text-cyan-400' : 'text-indigo-300'}`}>
                    {msg.speakerName}
                    {speakingId === msg.speakerId && !msg.isHuman && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    )}
                  </div>
                  <div className="text-slate-300 leading-relaxed">{msg.text}</div>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-slate-600 text-xs text-center pt-6">Transcript appears here</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
