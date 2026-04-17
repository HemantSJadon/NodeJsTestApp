/**
 * simulate.js — Full end-to-end simulation of the MBA GD game
 * Uses a mock AI engine so no API key needed; validates game logic, timing, events.
 *
 * Run: node test/simulate.js
 */

import { GameManager } from '../src/lib/gameManager.js';

// ── Mock AI Engine ──────────────────────────────────────────────────────────
const FAKE_LINES = {
  assertive: "I want to anchor the discussion: the core issue here is structural, not incidental. We need bold, decisive reform.",
  analytical: "Looking at the data, three dimensions emerge. Economically, the impact is measurable. Socially, the ripple effects are complex.",
  collaborative: "Building on what was just said — I think both perspectives can coexist. The key is finding the right balance.",
  devil_advocate: "I'd push back on that framing. Have we stress-tested the assumption that this policy will actually achieve its stated goal?",
  quiet: "I've been listening carefully, and one dimension missing from this discussion is the long-term implementation challenge.",
  verbose: "You know, this reminds me of a parallel case in 2019 when a similar initiative was tried. The outcomes were nuanced, to say the least.",
};

class MockAIEngine {
  async assignStances(room) {
    const stances = ['strongly in favour', 'generally in favour with caveats', 'neutral and analytical', 'generally against', 'strongly against'];
    room.candidates.forEach((c, i) => {
      c.stance = stances[i % stances.length];
      c.speakingCount = 0; c.totalWords = 0; c.lastSpoke = 0;
    });
  }

  async generateModeratorIntro(room) {
    return `Welcome, everyone. Today's topic is "${room.topic}". You have 2 minutes to collect your thoughts, followed by a ${Math.round(room.discussionDuration / 60000)}-minute group discussion. Please be concise, respectful, and ensure everyone gets a chance to contribute.`;
  }

  async generateCandidateUtterance(room, candidate) {
    // Simulate ~200ms API latency
    await new Promise(r => setTimeout(r, 200));
    const base = FAKE_LINES[candidate.personality] || "That's an important point worth exploring further.";
    return `${base} [Turn ${room.messages.filter(m => m.speakerId === candidate.id).length + 1}]`;
  }

  async generateModeratorIntervention(room) {
    await new Promise(r => setTimeout(r, 100));
    // Only intervene occasionally
    if (Math.random() < 0.6) return null;
    return "Let's ensure we're staying focused on the core question. Any perspectives we haven't heard yet?";
  }

  async generateClosingStatement(room, candidate) {
    await new Promise(r => setTimeout(r, 100));
    return `In summary, my position is clear: ${candidate.stance}. The key takeaway is that this requires careful, evidence-based decision-making.`;
  }

  async generateHumanClosingPrompt(room) {
    return `${room.humanName}, what's your final position on this topic?`;
  }

  async generateReviews(room) {
    await new Promise(r => setTimeout(r, 300));
    const all = [...room.candidates, { id: 'human', name: room.humanName, isHuman: true }];
    return all.map(p => {
      const turns = room.messages.filter(m => m.speakerId === p.id || (p.isHuman && m.isHuman)).length;
      const base = Math.min(10, Math.max(3, 4 + turns));
      return {
        candidateId: p.id,
        candidateName: p.name,
        isHuman: p.isHuman || false,
        scores: {
          communication: base + Math.floor(Math.random() * 2),
          content: base - 1 + Math.floor(Math.random() * 2),
          leadership: base - 1 + Math.floor(Math.random() * 3),
          listening: base + Math.floor(Math.random() * 2),
          initiative: base + Math.floor(Math.random() * 2),
          overall: base,
        },
        feedback: `${p.name} participated ${turns > 3 ? 'actively' : 'minimally'} with ${turns} contribution(s). ${turns > 3 ? 'Demonstrated good engagement.' : 'Could speak more confidently.'}`,
        strengths: turns > 2 ? ['Clear communication', 'Stayed on topic'] : ['Showed awareness of discussion'],
        improvements: ['Could initiate more new points', 'Engage more directly with other speakers'],
        standoutMoment: turns > 0 ? `Turn ${Math.ceil(turns / 2)}: introduced a key angle on the topic` : null,
      };
    });
  }
}

// ── Simulation runner ────────────────────────────────────────────────────────
async function run() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  MBA GD Simulator — Full End-to-End Simulation Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const mgr = new GameManager('test-key');
  mgr.aiEngine = new MockAIEngine();

  // Create room with 3-minute discussion for fast testing
  const room = mgr.createRoom({
    topic: 'Should India adopt a Universal Basic Income?',
    panelType: 'mixed',
    candidateCount: 4,
    discussionDuration: 3, // will be overridden to 20s below for speed
  });
  room.discussionDuration = 20_000; // 20 seconds for test speed
  room.humanName = 'Aditya Kumar (Test Human)';

  console.log(`Room ID:    ${room.id}`);
  console.log(`Topic:      ${room.topic}`);
  console.log(`Panel:      ${room.panelType}`);
  console.log(`Duration:   ${room.discussionDuration / 60000} minutes`);
  console.log(`Candidates: ${room.candidates.map(c => `${c.name} (${c.personality})`).join(', ')}`);
  console.log('');

  const eventLog = [];
  const timings = { phaseTransitions: [], utterances: [] };
  let lastEventTime = Date.now();

  const emit = (event, data) => {
    const now = Date.now();
    const elapsed = ((now - lastEventTime) / 1000).toFixed(1);
    lastEventTime = now;
    eventLog.push({ event, data, ts: now });

    if (event === 'phase-change') {
      const label = `[+${elapsed}s] 📍 Phase → ${data.phase}`;
      console.log(label);
      timings.phaseTransitions.push({ phase: data.phase, elapsed: parseFloat(elapsed) });
    } else if (event === 'ai-speaking') {
      const words = data.text.split(' ').length;
      const preview = data.text.slice(0, 70) + (data.text.length > 70 ? '…' : '');
      console.log(`[+${elapsed}s] 🗣  ${data.speakerName}${data.isModerator ? ' [MOD]' : ''} (${words}w): "${preview}"`);
      timings.utterances.push({ speaker: data.speakerName, words, elapsed: parseFloat(elapsed) });

      // Immediately signal TTS completion (no browser in test)
      setImmediate(() => mgr.onUtteranceComplete(data.messageId));
    } else if (event === 'message-added' && data?.isHuman) {
      console.log(`[+${elapsed}s] 👤 Human: "${data.text.slice(0, 70)}"`);
    } else if (event === 'human-turn-opportunity') {
      // Simulate human speaking on every other opportunity
      if (Math.random() > 0.5 && room.phase === 'discussion') {
        setTimeout(() => {
          const text = "I think we should consider both the fiscal constraints and the social impact carefully. UBI is promising but requires rigorous piloting first.";
          mgr.addHumanSpeech(room.id, text);
          const humanMsg = { id: 'h-' + Date.now(), speakerId: 'human', speakerName: room.humanName, text, timestamp: Date.now(), isHuman: true, isModerator: false };
          emit('message-added', humanMsg);
        }, 500);
      }
    } else if (event === 'awaiting-human-closing') {
      setTimeout(() => {
        const closingText = "My final position: UBI can work in India, but only with a phased approach and strong fiscal backing. The data from pilot programs should guide us.";
        mgr.addHumanSpeech(room.id, closingText);
        mgr.humanClosingDone(room.id);
        const closingMsg = { id: 'hc-' + Date.now(), speakerId: 'human', speakerName: room.humanName, text: closingText, timestamp: Date.now(), isHuman: true, isModerator: false };
        emit('message-added', closingMsg);
      }, 800);
    } else if (event === 'reviews-ready') {
      console.log(`[+${elapsed}s] 📊 Reviews ready for ${data.reviews.length} participants`);
    } else if (event === 'game-error') {
      console.error(`[+${elapsed}s] ❌ GAME ERROR: ${data.message}`);
    }
  };

  // Speed up all sleeps for testing (cap at 300ms each)
  const origSleep = mgr._sleep.bind(mgr);
  const fastSleep = async (ms) => origSleep(Math.min(ms, 300));
  mgr._sleep = fastSleep;
  mgr._interruptibleSleep = async (ms, room, loopState) => {
    const end = Date.now() + Math.min(ms, 500); // cap phases at 500ms for tests
    while (Date.now() < end) {
      if (loopState && !loopState.running) return;
      await fastSleep(50);
    }
  };

  const startTime = Date.now();
  await mgr.startGame(room.id, emit);
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  // ── Results report ────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SIMULATION RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`Total simulation time:   ${totalTime}s`);
  console.log(`Total events emitted:    ${eventLog.length}`);
  console.log(`Total messages logged:   ${room.messages.length}`);
  console.log(`Human turns:             ${room.metrics.humanTurns}`);
  console.log(`Human word count:        ${room.metrics.humanWordCount}`);

  // Phase flow
  const phases = timings.phaseTransitions.map(p => p.phase);
  const expectedPhases = ['intro', 'thinking', 'discussion', 'closing', 'generating-review', 'review'];
  const missingPhases = expectedPhases.filter(p => !phases.includes(p));
  console.log(`\nPhase flow:  ${phases.join(' → ')}`);
  if (missingPhases.length > 0) {
    console.log(`⚠️  MISSING PHASES: ${missingPhases.join(', ')}`);
  } else {
    console.log(`✅ All expected phases traversed`);
  }

  // Speaker distribution
  console.log('\nSpeaker distribution:');
  const counts = {};
  room.messages.filter(m => !m.isModerator).forEach(m => {
    counts[m.speakerName] = (counts[m.speakerName] || 0) + 1;
  });
  const totalNonMod = Object.values(counts).reduce((a, b) => a + b, 0);
  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([name, n]) => {
    const pct = Math.round((n / totalNonMod) * 100);
    const bar = '█'.repeat(Math.round(pct / 5));
    console.log(`  ${name.padEnd(32)} ${String(n).padStart(2)} turns  ${bar} ${pct}%`);
  });

  // Check no candidate dominated (>50% of turns)
  const dominance = Object.values(counts).map(n => n / totalNonMod);
  if (dominance.some(d => d > 0.5)) {
    console.log(`\n⚠️  WARNING: One speaker dominated >50% of turns`);
  } else {
    console.log(`\n✅ Speaker distribution balanced (no single speaker >50%)`);
  }

  // Reviews
  if (room.reviews) {
    console.log('\nFinal scores (ranked):');
    const sorted = [...room.reviews].sort((a, b) => b.scores.overall - a.scores.overall);
    sorted.forEach((r, i) => {
      const tag = r.isHuman ? ' ← YOU' : '';
      console.log(`  #${i + 1}  ${r.candidateName.padEnd(32)} Overall: ${r.scores.overall}/10${tag}`);
    });

    const humanReview = room.reviews.find(r => r.isHuman);
    if (humanReview) {
      console.log(`\n  Human feedback: "${humanReview.feedback}"`);
      if (humanReview.standoutMoment) {
        console.log(`  Standout moment: "${humanReview.standoutMoment}"`);
      }
    }
    console.log('\n✅ Reviews generated successfully');
  } else {
    console.log('\n❌ ERROR: Reviews were not generated');
  }

  // Idempotency test
  console.log('\n── Idempotency test ─────────────────────────────────');
  const prevMsgCount = room.messages.length;
  mgr.startGame(room.id, () => {}); // should be ignored
  await new Promise(r => setTimeout(r, 100));
  console.log(room.messages.length === prevMsgCount
    ? '✅ Double start-game correctly ignored'
    : '❌ FAIL: Double start-game added messages');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SIMULATION COMPLETE ✅');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

run().catch(err => {
  console.error('\n❌ SIMULATION FAILED:', err.message);
  console.error(err.stack);
  process.exit(1);
});
