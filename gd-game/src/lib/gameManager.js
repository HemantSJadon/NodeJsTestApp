import { v4 as uuidv4 } from 'uuid';
import { AIEngine } from './aiEngine.js';
import { generateCandidates } from './personalities.js';

export class GameManager {
  constructor(apiKey) {
    this.rooms = new Map();
    this.aiEngine = new AIEngine(apiKey);
    this.activeLoops = new Map();
  }

  getRooms() {
    return Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      topic: room.topic,
      panelType: room.panelType,
      phase: room.phase,
      candidateCount: room.candidates.length,
      createdAt: room.createdAt,
      humanName: room.humanName,
      discussionDuration: room.discussionDuration,
    }));
  }

  createRoom({ topic, panelType = 'mixed', candidateCount = 5, discussionDuration = 10 }) {
    const candidates = generateCandidates(
      Math.min(Math.max(candidateCount, 3), 7),
      panelType
    );

    const room = {
      id: uuidv4(),
      topic,
      panelType,
      phase: 'lobby',
      candidates,
      messages: [],
      createdAt: Date.now(),
      discussionDuration: discussionDuration * 60 * 1000,
      humanName: 'You',
      humanPaused: false,
      humanWaiting: false,
      reviews: null,
    };

    this.rooms.set(room.id, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  setHumanName(roomId, name) {
    const room = this.rooms.get(roomId);
    if (room) room.humanName = name;
  }

  addHumanSpeech(roomId, text) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const message = {
      id: uuidv4(),
      speakerId: 'human',
      speakerName: room.humanName,
      text,
      timestamp: Date.now(),
      isHuman: true,
      isModerator: false,
    };

    room.messages.push(message);
    room.humanPaused = false;
    return message;
  }

  pauseForHuman(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.humanPaused = true;
    }
  }

  resumeAfterHuman(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.humanPaused = false;
    }
  }

  async startGame(roomId, emit) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    this.activeLoops.set(roomId, { running: true });
    const loopState = this.activeLoops.get(roomId);

    try {
      // Phase: intro
      room.phase = 'intro';
      emit('phase-change', { phase: 'intro' });

      const introText = await this.aiEngine.generateModeratorIntro(room);
      const introMsg = this.addModeratorMessage(room, introText);
      emit('ai-speaking', {
        speakerId: 'moderator',
        speakerName: 'Moderator',
        text: introText,
        isModerator: true,
        voiceIndex: 0,
        messageId: introMsg.id,
      });
      emit('message-added', introMsg);
      await this.waitForSpeech(introText, room);

      if (!loopState.running) return;

      // Phase: thinking
      room.phase = 'thinking';
      const thinkDuration = 120000; // 2 minutes
      emit('phase-change', { phase: 'thinking', duration: thinkDuration });
      await this.sleep(thinkDuration, room, loopState);

      if (!loopState.running) return;

      // Phase: discussion
      room.phase = 'discussion';
      emit('phase-change', {
        phase: 'discussion',
        duration: room.discussionDuration,
      });

      const startMsg = `Alright, your thinking time is up. Let's begin the group discussion. I'll remind you — stay on topic, be respectful, and ensure everyone gets a chance to speak. You have ${Math.round(room.discussionDuration / 60000)} minutes. Please begin.`;
      const startMsgObj = this.addModeratorMessage(room, startMsg);
      emit('ai-speaking', {
        speakerId: 'moderator',
        speakerName: 'Moderator',
        text: startMsg,
        isModerator: true,
        voiceIndex: 0,
        messageId: startMsgObj.id,
      });
      emit('message-added', startMsgObj);
      await this.waitForSpeech(startMsg, room);

      if (!loopState.running) return;

      // Run the main discussion loop
      await this.runDiscussionLoop(room, emit, loopState);

      if (!loopState.running) return;

      // Phase: closing
      room.phase = 'closing';
      emit('phase-change', { phase: 'closing' });

      const closingIntro = `We're at the end of our time. I'll ask each participant, including our human candidate, to give one brief closing statement — your key takeaway or final position.`;
      const closingIntroMsg = this.addModeratorMessage(room, closingIntro);
      emit('ai-speaking', {
        speakerId: 'moderator',
        speakerName: 'Moderator',
        text: closingIntro,
        isModerator: true,
        voiceIndex: 0,
        messageId: closingIntroMsg.id,
      });
      emit('message-added', closingIntroMsg);
      await this.waitForSpeech(closingIntro, room);

      // AI candidates close
      for (const candidate of room.candidates) {
        if (!loopState.running) return;
        const text = await this.aiEngine.generateClosingStatement(room, candidate);
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
        candidate.speakingCount++;
        emit('ai-speaking', {
          speakerId: candidate.id,
          speakerName: candidate.name,
          text,
          voiceIndex: candidate.voiceIndex,
          messageId: msg.id,
        });
        emit('message-added', msg);
        await this.waitForSpeech(text, room);
        await this.sleep(600, room, loopState);
      }

      // Prompt human for closing
      const humanPrompt = await this.aiEngine.generateHumanClosingPrompt(room);
      const humanPromptMsg = this.addModeratorMessage(room, humanPrompt);
      emit('ai-speaking', {
        speakerId: 'moderator',
        speakerName: 'Moderator',
        text: humanPrompt,
        isModerator: true,
        voiceIndex: 0,
        messageId: humanPromptMsg.id,
      });
      emit('message-added', humanPromptMsg);
      emit('human-closing-prompt', {});
      await this.waitForSpeech(humanPrompt, room);

      // Wait for human closing statement (up to 60s)
      room.humanWaiting = true;
      emit('awaiting-human-closing', {});
      let waited = 0;
      while (room.humanWaiting && waited < 60000 && loopState.running) {
        await this.sleep(500, room, loopState);
        waited += 500;
      }
      room.humanWaiting = false;

      if (!loopState.running) return;

      // Moderator sign-off
      const signOff = `Thank you all for a stimulating discussion. That concludes today's group discussion. Your evaluations are being prepared now.`;
      const signOffMsg = this.addModeratorMessage(room, signOff);
      emit('ai-speaking', {
        speakerId: 'moderator',
        speakerName: 'Moderator',
        text: signOff,
        isModerator: true,
        voiceIndex: 0,
        messageId: signOffMsg.id,
      });
      emit('message-added', signOffMsg);
      await this.waitForSpeech(signOff, room);

      // Generate reviews
      room.phase = 'generating-review';
      emit('phase-change', { phase: 'generating-review' });

      const reviews = await this.aiEngine.generateReviews(room);
      room.reviews = reviews;

      room.phase = 'review';
      emit('phase-change', { phase: 'review' });
      emit('reviews-ready', { reviews, roomId });
    } catch (error) {
      console.error('Game loop error:', error);
      emit('game-error', { message: 'An error occurred. Please check your API key and try again.' });
    } finally {
      loopState.running = false;
    }
  }

  async runDiscussionLoop(room, emit, loopState) {
    const endTime = Date.now() + room.discussionDuration;
    let turnCount = 0;
    let consecutiveAITurns = 0;

    while (Date.now() < endTime && loopState.running) {
      // Wait if human is speaking
      while (room.humanPaused && loopState.running) {
        await this.sleep(300, room, loopState);
      }

      if (!loopState.running) return;

      // Check remaining time
      const remaining = endTime - Date.now();

      // Emit timer update
      emit('timer-update', { remaining });

      // If less than 45s remaining, give warning and end
      if (remaining < 45000) {
        const warnMsg = `We have under a minute remaining. Please wrap up your thoughts.`;
        const warnMsgObj = this.addModeratorMessage(room, warnMsg);
        emit('ai-speaking', {
          speakerId: 'moderator',
          speakerName: 'Moderator',
          text: warnMsg,
          isModerator: true,
          voiceIndex: 0,
          messageId: warnMsgObj.id,
        });
        emit('message-added', warnMsgObj);
        await this.waitForSpeech(warnMsg, room);
        // Wait out remaining time allowing human to speak
        await this.sleep(remaining, room, loopState);
        return;
      }

      // Select next speaker (weighted random)
      const candidate = this.selectNextSpeaker(room, turnCount);
      turnCount++;

      // Occasionally check if moderator should intervene (every 5-8 turns)
      if (turnCount % 6 === 0) {
        const modComment = await this.aiEngine.generateModeratorIntervention(room);
        if (modComment) {
          const modMsg = this.addModeratorMessage(room, modComment);
          emit('ai-speaking', {
            speakerId: 'moderator',
            speakerName: 'Moderator',
            text: modComment,
            isModerator: true,
            voiceIndex: 0,
            messageId: modMsg.id,
          });
          emit('message-added', modMsg);
          await this.waitForSpeech(modComment, room);
          await this.sleep(800, room, loopState);
          consecutiveAITurns = 0;
          continue;
        }
      }

      // Generate candidate utterance
      try {
        const text = await this.aiEngine.generateCandidateUtterance(room, candidate);

        if (!loopState.running) return;

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
        candidate.speakingCount++;
        candidate.lastSpoke = Date.now();

        emit('ai-speaking', {
          speakerId: candidate.id,
          speakerName: candidate.name,
          text,
          voiceIndex: candidate.voiceIndex,
          messageId: msg.id,
        });
        emit('message-added', msg);

        await this.waitForSpeech(text, room);

        consecutiveAITurns++;

        // After every 2-3 AI turns, pause briefly to let human speak
        if (consecutiveAITurns >= 2 + Math.floor(Math.random() * 2)) {
          emit('human-turn-opportunity', {});
          await this.sleep(3500, room, loopState);
          consecutiveAITurns = 0;
        } else {
          await this.sleep(900 + Math.random() * 1200, room, loopState);
        }
      } catch (error) {
        console.error('Utterance error:', error.message);
        await this.sleep(2000, room, loopState);
      }
    }
  }

  selectNextSpeaker(room, turnIndex) {
    const candidates = room.candidates;

    // Weight by how long since last spoke
    const now = Date.now();
    const weights = candidates.map((c) => {
      const timeSince = now - (c.lastSpoke || 0);
      const baseWeight = timeSince / 5000; // increases every 5 seconds of silence

      // Quiet personality speaks less frequently
      const personalityMod =
        c.personality === 'quiet' ? 0.5 : c.personality === 'verbose' ? 1.3 : 1.0;
      const assertiveMod = c.personality === 'assertive' ? 1.2 : 1.0;

      return Math.max(0.1, baseWeight * personalityMod * assertiveMod);
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;

    for (let i = 0; i < candidates.length; i++) {
      rand -= weights[i];
      if (rand <= 0) return candidates[i];
    }

    return candidates[turnIndex % candidates.length];
  }

  addModeratorMessage(room, text) {
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

  waitForSpeech(text, room) {
    const words = text.trim().split(/\s+/).length;
    const durationMs = Math.max((words / 140) * 60 * 1000, 1800);
    return this.sleep(durationMs, room, null);
  }

  sleep(ms, room, loopState) {
    return new Promise((resolve) => {
      const interval = 50;
      let elapsed = 0;
      const timer = setInterval(() => {
        elapsed += interval;
        if (elapsed >= ms || (loopState && !loopState.running)) {
          clearInterval(timer);
          resolve();
        }
      }, interval);
    });
  }

  stopGame(roomId) {
    const loopState = this.activeLoops.get(roomId);
    if (loopState) loopState.running = false;
  }

  humanClosingDone(roomId) {
    const room = this.rooms.get(roomId);
    if (room) room.humanWaiting = false;
  }
}
