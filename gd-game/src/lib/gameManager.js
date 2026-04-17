import { v4 as uuidv4 } from 'uuid';
import { AIEngine } from './aiEngine.js';
import { generateCandidates } from './personalities.js';

export class GameManager {
  constructor(apiKey) {
    this.rooms = new Map();
    this.aiEngine = new AIEngine(apiKey);
    this.activeLoops = new Map();
    // Client-driven timing: messageId → { resolve, timeoutId }
    this.pendingCompletions = new Map();
  }

  // ─── Public room helpers ───────────────────────────────────────────────────

  getRooms() {
    return Array.from(this.rooms.values()).map((r) => ({
      id: r.id,
      topic: r.topic,
      panelType: r.panelType,
      phase: r.phase,
      candidateCount: r.candidates.length,
      createdAt: r.createdAt,
      humanName: r.humanName,
      discussionDuration: r.discussionDuration,
    }));
  }

  getRoomPublic(roomId) {
    const r = this.rooms.get(roomId);
    if (!r) return null;
    return {
      id: r.id,
      topic: r.topic,
      panelType: r.panelType,
      phase: r.phase,
      candidates: r.candidates,
      messages: r.messages,
      createdAt: r.createdAt,
      discussionDuration: r.discussionDuration,
      humanName: r.humanName,
      reviews: r.reviews,
    };
  }

  createRoom({ topic, panelType = 'mixed', candidateCount = 5, discussionDuration = 10 }) {
    const count = Math.min(Math.max(Math.round(candidateCount), 3), 7);
    const duration = Math.min(Math.max(Math.round(discussionDuration), 3), 20);
    const candidates = generateCandidates(count, panelType);

    const room = {
      id: uuidv4(),
      topic: topic.trim(),
      panelType,
      phase: 'lobby',
      candidates,
      messages: [],
      createdAt: Date.now(),
      discussionDuration: duration * 60 * 1000,
      humanName: 'You',
      humanPaused: false,
      humanWaiting: false,
      reviews: null,
      started: false,
      // Per-candidate metrics for accurate review generation
      metrics: {
        totalTurns: 0,
        humanTurns: 0,
        humanWordCount: 0,
      },
    };

    this.rooms.set(room.id, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  setHumanName(roomId, name) {
    const r = this.rooms.get(roomId);
    if (r && name) r.humanName = name;
  }

  addHumanSpeech(roomId, text) {
    const r = this.rooms.get(roomId);
    if (!r || !text) return null;

    const wordCount = text.trim().split(/\s+/).length;
    r.metrics.humanTurns++;
    r.metrics.humanWordCount += wordCount;

    const msg = {
      id: uuidv4(),
      speakerId: 'human',
      speakerName: r.humanName,
      text: text.trim(),
      timestamp: Date.now(),
      isHuman: true,
      isModerator: false,
    };
    r.messages.push(msg);
    r.humanPaused = false;
    return msg;
  }

  pauseForHuman(roomId) {
    const r = this.rooms.get(roomId);
    if (r) r.humanPaused = true;
  }

  resumeAfterHuman(roomId) {
    const r = this.rooms.get(roomId);
    if (r) r.humanPaused = false;
  }

  humanClosingDone(roomId) {
    const r = this.rooms.get(roomId);
    if (r) r.humanWaiting = false;
  }

  // ─── Client-driven TTS timing ──────────────────────────────────────────────

  // Called when client's browser TTS finishes playing a message
  onUtteranceComplete(messageId) {
    const pending = this.pendingCompletions.get(messageId);
    if (pending) {
      clearTimeout(pending.timeoutId);
      this.pendingCompletions.delete(messageId);
      pending.resolve();
    }
  }

  // Wait for client to signal TTS done, with a generous fallback timeout
  _waitForClientTTS(messageId, estimatedMs) {
    return new Promise((resolve) => {
      const fallback = Math.max(estimatedMs + 10000, 5000);
      const timeoutId = setTimeout(() => {
        this.pendingCompletions.delete(messageId);
        resolve();
      }, fallback);
      this.pendingCompletions.set(messageId, { resolve, timeoutId });
    });
  }

  // ─── Game orchestration ────────────────────────────────────────────────────

  async startGame(roomId, emit) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.started) return; // idempotency guard
    room.started = true;

    const loopState = { running: true };
    this.activeLoops.set(roomId, loopState);

    try {
      // Assign topic stances to candidates before anything starts
      await this.aiEngine.assignStances(room);

      // ── Phase: intro ──────────────────────────────────────────────────────
      room.phase = 'intro';
      emit('phase-change', { phase: 'intro' });

      const introText = await this.aiEngine.generateModeratorIntro(room);
      const introMsg = this._addModMsg(room, introText);
      await this._emitAndWait(emit, room, 'moderator', introMsg, 0, loopState);

      if (!loopState.running) return;

      // ── Phase: thinking (2 min) ───────────────────────────────────────────
      room.phase = 'thinking';
      const thinkDuration = 120_000;
      emit('phase-change', { phase: 'thinking', duration: thinkDuration });
      await this._interruptibleSleep(thinkDuration, room, loopState);
      if (!loopState.running) return;

      // ── Phase: discussion ─────────────────────────────────────────────────
      room.phase = 'discussion';
      emit('phase-change', { phase: 'discussion', duration: room.discussionDuration });

      const kickoffText = `Alright, thinking time is up. Let's begin the group discussion. You have ${Math.round(room.discussionDuration / 60_000)} minutes. Please keep your contributions focused and respectful. The floor is open.`;
      const kickoffMsg = this._addModMsg(room, kickoffText);
      await this._emitAndWait(emit, room, 'moderator', kickoffMsg, 0, loopState);
      if (!loopState.running) return;

      await this._runDiscussionLoop(room, emit, loopState);
      if (!loopState.running) return;

      // ── Phase: closing ────────────────────────────────────────────────────
      room.phase = 'closing';
      emit('phase-change', { phase: 'closing' });

      const closingIntro = `We're at time. I'd like a brief closing statement from each participant — one sentence capturing your core position. AI candidates first, then our human candidate.`;
      const closingIntroMsg = this._addModMsg(room, closingIntro);
      await this._emitAndWait(emit, room, 'moderator', closingIntroMsg, 0, loopState);
      if (!loopState.running) return;

      for (const candidate of room.candidates) {
        if (!loopState.running) return;
        const text = await this._withRetry(() =>
          this.aiEngine.generateClosingStatement(room, candidate)
        );
        const msg = this._addCandidateMsg(room, candidate, text);
        await this._emitAndWait(emit, room, candidate.id, msg, candidate.voiceIndex, loopState);
        await this._interruptibleSleep(400, room, loopState);
      }

      // Human closing
      if (!loopState.running) return;
      const humanPrompt = `${room.humanName}, finally — your closing statement please.`;
      const humanPromptMsg = this._addModMsg(room, humanPrompt);
      await this._emitAndWait(emit, room, 'moderator', humanPromptMsg, 0, loopState);
      emit('awaiting-human-closing', {});
      room.humanWaiting = true;

      let waited = 0;
      while (room.humanWaiting && waited < 75_000 && loopState.running) {
        await this._sleep(500);
        waited += 500;
      }
      room.humanWaiting = false;

      if (!loopState.running) return;

      const signOff = `Thank you all for a substantive discussion. That concludes today's group discussion. Your performance evaluations are being prepared now.`;
      const signOffMsg = this._addModMsg(room, signOff);
      await this._emitAndWait(emit, room, 'moderator', signOffMsg, 0, loopState);

      // ── Phase: generating reviews ─────────────────────────────────────────
      room.phase = 'generating-review';
      emit('phase-change', { phase: 'generating-review' });

      const reviews = await this.aiEngine.generateReviews(room);
      room.reviews = reviews;

      room.phase = 'review';
      emit('phase-change', { phase: 'review' });
      emit('reviews-ready', { reviews, roomId });
    } catch (err) {
      console.error(`[Room ${roomId}] Game loop error:`, err);
      emit('game-error', {
        message: err.message?.includes('API key')
          ? 'Invalid or missing Anthropic API key. Please check your server configuration.'
          : 'An error occurred during the discussion. Please check the server logs.',
      });
    } finally {
      loopState.running = false;
      this.activeLoops.delete(roomId);
    }
  }

  async _runDiscussionLoop(room, emit, loopState) {
    const endTime = Date.now() + room.discussionDuration;
    let turnCount = 0;
    let warnedAtEnd = false;

    // Pre-generate first AI utterance immediately
    let nextSpeaker = this._selectNextSpeaker(room, turnCount);
    let nextGenPromise = this._withRetry(() =>
      this.aiEngine.generateCandidateUtterance(room, nextSpeaker)
    );

    while (Date.now() < endTime && loopState.running) {
      // Pause if human is speaking
      while (room.humanPaused && loopState.running) {
        await this._sleep(200);
      }
      if (!loopState.running) return;

      const remaining = endTime - Date.now();

      // 45-second warning (once)
      if (remaining < 45_000 && !warnedAtEnd) {
        warnedAtEnd = true;
        const warnText = `We have under a minute remaining. Please begin to wrap up.`;
        const warnMsg = this._addModMsg(room, warnText);
        await this._emitAndWait(emit, room, 'moderator', warnMsg, 0, loopState);
        // Don't break — let remaining time play out for human to respond
      }

      if (remaining <= 0) break;

      // ── Moderator intervention check (every 5-7 turns) ──
      if (turnCount > 0 && turnCount % (5 + Math.floor(Math.random() * 3)) === 0) {
        const modText = await this._withRetry(
          () => this.aiEngine.generateModeratorIntervention(room),
          2
        );
        if (modText) {
          const modMsg = this._addModMsg(room, modText);
          await this._emitAndWait(emit, room, 'moderator', modMsg, 0, loopState);
          await this._interruptibleSleep(600, room, loopState);

          // After moderator, give human a window
          emit('human-turn-opportunity', {});
          await this._interruptibleSleep(4000, room, loopState);
          if (room.humanPaused) {
            while (room.humanPaused && loopState.running) await this._sleep(200);
            if (!loopState.running) return;
          }
          continue;
        }
      }

      // ── Get the pre-generated utterance ──
      const currentSpeaker = nextSpeaker;
      let text;
      try {
        text = await nextGenPromise;
      } catch (err) {
        console.error('Pre-gen failed, skipping turn:', err.message);
        // Advance to next speaker and re-pre-generate
        turnCount++;
        nextSpeaker = this._selectNextSpeaker(room, turnCount);
        nextGenPromise = this._withRetry(() =>
          this.aiEngine.generateCandidateUtterance(room, nextSpeaker)
        );
        await this._sleep(1000);
        continue;
      }

      // ── Add message to room history FIRST (so next speaker selection sees it) ──
      const msg = this._addCandidateMsg(room, currentSpeaker, text);

      // ── Immediately start generating the NEXT utterance in background ──
      turnCount++;
      room.metrics.totalTurns++;
      nextSpeaker = this._selectNextSpeaker(room, turnCount);
      nextGenPromise = this._withRetry(() =>
        this.aiEngine.generateCandidateUtterance(room, nextSpeaker)
      );
      await this._emitAndWait(emit, room, currentSpeaker.id, msg, currentSpeaker.voiceIndex, loopState);
      if (!loopState.running) return;

      // ── Natural pause between turns ──
      const pauseMs = 700 + Math.random() * 1200;
      await this._interruptibleSleep(pauseMs, room, loopState);

      // ── Periodic human opportunity (every 2-3 AI turns) ──
      if (turnCount % (2 + Math.floor(Math.random() * 2)) === 0) {
        emit('human-turn-opportunity', {});
        await this._interruptibleSleep(3500, room, loopState);
        if (room.humanPaused) {
          while (room.humanPaused && loopState.running) await this._sleep(200);
        }
      }
    }
  }

  // ─── Speaker selection ────────────────────────────────────────────────────

  _selectNextSpeaker(room, turnIndex) {
    const candidates = room.candidates;
    const now = Date.now();

    // Who just spoke? Never let same person speak twice in a row (unless only 1 candidate)
    const lastMsg = room.messages.filter((m) => !m.isModerator && !m.isHuman).slice(-1)[0];
    const justSpokeId = lastMsg?.speakerId;

    const weights = candidates.map((c) => {
      // Hard-block consecutive same speaker (>1 candidate only)
      if (candidates.length > 1 && c.id === justSpokeId) return 0.001;

      // Base: time since last spoke (seconds), starting from a small baseline
      const silenceSec = Math.max((now - (c.lastSpoke || now - 30_000)) / 1000, 1);

      // Personality multiplier
      const personalityMult = {
        assertive: 1.4,
        analytical: 1.1,
        collaborative: 1.0,
        devil_advocate: 1.2,
        quiet: 0.55,
        verbose: 1.25,
      }[c.personality] ?? 1.0;

      // Penalise if they just spoke in last 2 turns
      const recentMessages = room.messages.slice(-4);
      const spokenRecently = recentMessages.filter((m) => m.speakerId === c.id).length;
      const recencyPenalty = spokenRecently > 1 ? 0.3 : spokenRecently === 1 ? 0.7 : 1.0;

      return Math.max(0.05, silenceSec * 0.1 * personalityMult * recencyPenalty);
    });

    const total = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (let i = 0; i < candidates.length; i++) {
      rand -= weights[i];
      if (rand <= 0) return candidates[i];
    }
    return candidates[turnIndex % candidates.length];
  }

  // ─── Message helpers ──────────────────────────────────────────────────────

  _addModMsg(room, text) {
    const msg = {
      id: uuidv4(),
      speakerId: 'moderator',
      speakerName: 'Moderator',
      text,
      timestamp: Date.now(),
      isHuman: false,
      isModerator: true,
    };
    room.messages.push(msg);
    return msg;
  }

  _addCandidateMsg(room, candidate, text) {
    candidate.speakingCount = (candidate.speakingCount || 0) + 1;
    candidate.totalWords = (candidate.totalWords || 0) + text.split(/\s+/).length;
    candidate.lastSpoke = Date.now();

    const msg = {
      id: uuidv4(),
      speakerId: candidate.id,
      speakerName: candidate.name,
      text,
      timestamp: Date.now(),
      isHuman: false,
      isModerator: false,
    };
    room.messages.push(msg);
    return msg;
  }

  // ─── Emit + wait for client TTS completion ─────────────────────────────────

  async _emitAndWait(emit, room, speakerId, msg, voiceIndex, loopState) {
    const isModerator = msg.isModerator;
    const estimatedMs = this._estimateSpeechMs(msg.text);

    emit('ai-speaking', {
      speakerId,
      speakerName: msg.speakerName,
      text: msg.text,
      isModerator,
      voiceIndex,
      messageId: msg.id,
    });
    emit('message-added', msg);

    // Wait for client TTS completion signal (or timeout fallback)
    await this._waitForClientTTS(msg.id, estimatedMs);

    // Small buffer even after completion signal
    if (loopState && loopState.running) {
      await this._sleep(200);
    }
  }

  // ─── Timing utilities ─────────────────────────────────────────────────────

  _estimateSpeechMs(text) {
    const words = text.trim().split(/\s+/).length;
    // Browser TTS default rate ≈ 160 WPM
    return Math.max((words / 160) * 60_000, 1500);
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Interruptible sleep: cancels cleanly when loop stops or human pauses
  async _interruptibleSleep(ms, room, loopState) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (!loopState.running) return;
      await this._sleep(Math.min(100, end - Date.now()));
    }
  }

  // ─── Retry wrapper ────────────────────────────────────────────────────────

  async _withRetry(fn, maxAttempts = 3) {
    let lastErr;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (err.status === 401) throw err; // Auth errors — don't retry
        const backoff = attempt * 1500;
        console.warn(`Attempt ${attempt}/${maxAttempts} failed: ${err.message}. Retrying in ${backoff}ms…`);
        await this._sleep(backoff);
      }
    }
    throw lastErr;
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  stopGame(roomId) {
    const state = this.activeLoops.get(roomId);
    if (state) state.running = false;

    // Cancel any pending TTS completions for this room
    const room = this.rooms.get(roomId);
    if (room) {
      for (const msg of room.messages) {
        this.onUtteranceComplete(msg.id);
      }
    }
  }

  stopAllGames() {
    for (const [, state] of this.activeLoops) {
      state.running = false;
    }
    for (const [, pending] of this.pendingCompletions) {
      clearTimeout(pending.timeoutId);
      pending.resolve();
    }
    this.pendingCompletions.clear();
  }

  cleanupOldRooms(maxAgeMs) {
    const now = Date.now();
    for (const [id, room] of this.rooms) {
      const isOld = now - room.createdAt > maxAgeMs;
      const isDone = room.phase === 'review' || room.phase === 'lobby';
      if (isOld && isDone) {
        this.stopGame(id);
        this.rooms.delete(id);
      }
    }
  }
}
