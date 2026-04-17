import Anthropic from '@anthropic-ai/sdk';

const PANEL_CONTEXT = {
  collaborative: 'The panel is COLLABORATIVE — candidates genuinely build on each other\'s ideas, use phrases like "Expanding on what [name] said", acknowledge good points openly, and work toward collective insight. Tone is constructive and warm.',
  competitive: 'The panel is COMPETITIVE — each candidate is trying to stand out and impress the moderator individually. They politely challenge weak points, bring unique angles, and clearly differentiate themselves. Professional but assertive.',
  hostile: 'The panel is HOSTILE — strong egos, frequent challenge, some interruptions (shown as "—"), dismissive language, candidates try to undercut others while maintaining surface-level professionalism. Tense and charged.',
  mixed: 'The panel is MIXED — realistic dynamics with some candidates being collaborative, others competitive. Moments of genuine agreement and moments of challenge. Most realistic simulation of a real MBA GD.',
};

const PERSONALITY_STYLE = {
  assertive:
    'You are assertive and self-assured. You speak first, use phrases like "I\'d like to anchor the discussion with—", "My position is clear:", take initiative. Short, punchy, direct sentences. Leadership in tone.',
  analytical:
    'You are analytical. You bring structure: "There are three dimensions here—", cite macro data or case examples, reference frameworks (Porter\'s Five Forces, SWOT, policy benchmarks). Methodical, credible, fact-grounded.',
  collaborative:
    'You are a natural bridge-builder. You frequently reference others: "Building on Arjun\'s point—", "I agree with the framework Priya outlined, but want to add—". Empathetic, inclusive, consensus-seeking.',
  devil_advocate:
    'You play devil\'s advocate. You probe and challenge: "But have we stress-tested that assumption?", "The data actually shows the opposite trend in—", "I\'d push back—". Respectful but persistently questioning.',
  quiet:
    'You are the thoughtful, economical speaker. Long silences, then impactful contribution: "I\'ve been listening carefully, and one dimension missing from this discussion is—". Few but high-value contributions. Never rambles.',
  verbose:
    'You are enthusiastic and expressive — a natural storyteller. You use vivid analogies, real-world anecdotes ("I recall reading that—"), and sometimes go slightly off on a tangent before returning to the point. Engaging but slightly long.',
};

const INDIAN_MBA_CONTEXT = `This is an MBA group discussion for top Indian B-schools (IIM A/B/C/L/K, ISB, XLRI, FMS, MDI).
Candidates have 2-6 years of work experience. They are well-read, aware of Indian and global policy, business trends, and social issues.
References to NITI Aayog, Make in India, India@2047, GST, UPI, PLI schemes, SEBI, RBI policy, India's demographic dividend, etc. are natural and expected.
The discussion should reflect the depth and sophistication expected of candidates aiming for these institutions.`;

export class AIEngine {
  constructor(apiKey) {
    if (!apiKey) {
      console.warn('AIEngine: No API key provided — all API calls will fail');
    }
    this.client = new Anthropic({ apiKey: apiKey || 'missing' });
  }

  // ─── Stance assignment ────────────────────────────────────────────────────

  async assignStances(room) {
    // Give each candidate a brief "private" position on the topic
    // This makes their arguments coherent and distinct throughout the discussion
    const stanceOptions = ['strongly in favour', 'generally in favour with caveats', 'neutral and analytical', 'generally against with conditions', 'strongly against'];

    room.candidates.forEach((candidate, i) => {
      candidate.stance = stanceOptions[i % stanceOptions.length];
      candidate.speakingCount = 0;
      candidate.totalWords = 0;
      candidate.lastSpoke = 0;
    });
  }

  // ─── Moderator ────────────────────────────────────────────────────────────

  async generateModeratorIntro(room) {
    const prompt = `You are a composed, professional moderator running a group discussion for MBA admissions at a top Indian B-school.

Topic: "${room.topic}"
Candidates in the room: ${room.candidates.length}
Panel type: ${room.panelType}
Discussion duration: ${Math.round(room.discussionDuration / 60_000)} minutes

Generate a crisp, professional moderator introduction (70–90 words) that:
1. Welcomes candidates warmly but efficiently
2. States the topic clearly
3. Mentions they have 2 minutes of thinking time before the discussion
4. States the total discussion time
5. One brief ground rule (mutual respect, no interruptions)

Tone: calm, authoritative, neutral. No filler phrases. Respond ONLY with the moderator's spoken words.`;

    return this._callAPI(prompt, 200);
  }

  async generateModeratorIntervention(room) {
    const recent = room.messages.slice(-8).map((m) => `${m.speakerName}: ${m.text}`).join('\n');
    const humanTurns = room.messages.filter((m) => m.isHuman).length;
    const totalNonModTurns = room.messages.filter((m) => !m.isModerator).length;
    const humanParticipation = totalNonModTurns > 0 ? humanTurns / totalNonModTurns : 1;

    const nudgeHuman =
      humanParticipation < 0.12 && totalNonModTurns > 5
        ? `The human candidate (${room.humanName}) has barely spoken. Directly invite them by name now.`
        : '';

    const prompt = `You are the moderator of an MBA group discussion.
Topic: "${room.topic}"
Panel type: ${room.panelType}

Recent conversation:
${recent}

${nudgeHuman}

As moderator, decide if a brief intervention is needed. Options:
- Redirect if the discussion drifted off topic
- Invite a quiet participant by name
- Ask someone to elaborate or give an example
- Note discussion is at the midpoint

Generate ONE brief moderator line (max 30 words) OR respond with exactly the word SKIP.
Respond with SKIP ~65% of the time unless nudging the human is needed.`;

    const result = await this._callAPI(prompt, 80);
    return result.trim().toUpperCase() === 'SKIP' || result.trim().startsWith('SKIP') ? null : result.trim();
  }

  // ─── Candidate utterances ─────────────────────────────────────────────────

  async generateCandidateUtterance(room, candidate) {
    const recent = room.messages.slice(-10).map((m) => `${m.speakerName}: ${m.text}`).join('\n');
    const lastMsg = room.messages.filter((m) => !m.isModerator).slice(-1)[0];

    const prompt = `${INDIAN_MBA_CONTEXT}

You are ${candidate.name}, an MBA candidate in a group discussion.
Background: ${candidate.background}
Your private stance on the topic: ${candidate.stance || 'analytical and balanced'}
Personality style: ${PERSONALITY_STYLE[candidate.personality] || 'thoughtful and engaged'}

${PANEL_CONTEXT[room.panelType]}

Discussion topic: "${room.topic}"

Conversation so far:
${recent || '(Discussion just beginning.)'}

${lastMsg ? `Last speaker: ${lastMsg.speakerName}` : ''}

YOUR TURN. Generate ONE natural spoken contribution (2–4 sentences, 40–70 words).
RULES:
- React to what was just said if it's relevant to your stance
- Introduce a genuinely NEW sub-point, angle, or challenge — never repeat what's already been said
- Stay tightly on the topic
- Express your personality through word choice and rhythm
- Do NOT prefix with your own name, quotes, or meta-phrases like "I would like to say"
- Write as if speaking aloud — contractions, natural rhythm, no overly formal language

Respond with ONLY the words ${candidate.name} speaks:`;

    return this._callAPI(prompt, 150);
  }

  async generateClosingStatement(room, candidate) {
    const candidateLines = room.messages
      .filter((m) => m.speakerId === candidate.id)
      .map((m) => m.text)
      .join(' ');

    const prompt = `You are ${candidate.name} wrapping up an MBA group discussion on "${room.topic}".
Your stance: ${candidate.stance || 'balanced'}
Personality: ${PERSONALITY_STYLE[candidate.personality] || 'professional'}

Your contributions during the discussion:
${candidateLines || '(You contributed minimally.)'}

Generate ONE memorable closing statement (1–2 sentences, max 45 words).
- Crystallise your core position
- Be confident, clear, forward-looking
- Fit your personality style

Respond with ONLY what ${candidate.name} says:`;

    return this._callAPI(prompt, 110);
  }

  async generateHumanClosingPrompt(room) {
    return `${room.humanName}, we'd love to hear your closing thought. What's your key takeaway from today's discussion?`;
  }

  // ─── Review generation ────────────────────────────────────────────────────

  async generateReviews(room) {
    const participants = [
      ...room.candidates,
      {
        id: 'human',
        name: room.humanName,
        isHuman: true,
        personality: 'human',
        background: 'Human candidate under evaluation',
        stance: 'to be assessed from contributions',
        speakingCount: room.metrics?.humanTurns || 0,
        totalWords: room.metrics?.humanWordCount || 0,
      },
    ];

    const fullTranscript = room.messages
      .map((m) => `[${m.isModerator ? 'MOD' : m.isHuman ? 'HUMAN' : 'AI'}] ${m.speakerName}: ${m.text}`)
      .join('\n');

    const totalNonModMsgs = room.messages.filter((m) => !m.isModerator).length;

    // Generate all reviews in parallel (fast)
    const reviews = await Promise.all(
      participants.map((p) => this._generateSingleReview(p, room, fullTranscript, totalNonModMsgs))
    );

    return reviews;
  }

  async _generateSingleReview(participant, room, fullTranscript, totalNonModMsgs) {
    const pMessages = room.messages.filter(
      (m) => m.speakerId === participant.id || (participant.isHuman && m.isHuman)
    );
    const pText = pMessages.map((m) => m.text).join('\n');
    const pTurns = pMessages.length;
    const pWords = participant.totalWords || pText.split(/\s+/).filter(Boolean).length;
    const participationPct =
      totalNonModMsgs > 0 ? Math.round((pTurns / totalNonModMsgs) * 100) : 0;

    const prompt = `You are a senior MBA admissions panelist with 15+ years of experience evaluating group discussions at top Indian B-schools (IIM, ISB, XLRI).

${INDIAN_MBA_CONTEXT}

Discussion topic: "${room.topic}"
Panel type: ${room.panelType}
Total discussion messages (excl. moderator): ${totalNonModMsgs}

FULL TRANSCRIPT:
${fullTranscript}

─────────────────────────────────────────
CANDIDATE BEING EVALUATED: ${participant.name}${participant.isHuman ? ' ← THIS IS THE HUMAN CANDIDATE' : ''}
Speaking turns: ${pTurns} (${participationPct}% of total discussion)
Estimated words spoken: ${pWords}
Their contributions:
${pText || '(This candidate did not speak during the discussion.)'}
─────────────────────────────────────────

Evaluate this candidate rigorously and honestly. Consider:
- COMMUNICATION (1-10): Clarity, articulation, sentence structure, confidence of delivery
- CONTENT (1-10): Depth of knowledge, relevance of points, use of data/examples, originality
- LEADERSHIP (1-10): Took initiative, set direction, led the discussion at key moments
- LISTENING (1-10): Referenced others' points, built on ideas, showed awareness of discussion flow
- INITIATIVE (1-10): First to speak, introduced new angles, drove discussion forward

Scoring guide: 9-10 = exceptional (top 5%), 7-8 = strong (top 25%), 5-6 = average, 3-4 = below average, 1-2 = poor

For the human candidate, be especially specific and actionable — they are here to improve.

Return ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "scores": {
    "communication": <1-10 integer>,
    "content": <1-10 integer>,
    "leadership": <1-10 integer>,
    "listening": <1-10 integer>,
    "initiative": <1-10 integer>,
    "overall": <1-10 integer>
  },
  "feedback": "<3 sentences: overall assessment, what worked, what didn't>",
  "strengths": ["<specific strength with example from transcript>", "<second specific strength>"],
  "improvements": ["<specific improvement with example of what to do differently>", "<second improvement>"],
  "standoutMoment": "<one sentence — their most impactful contribution, or note if absent>"
}`;

    try {
      const raw = await this._callAPI(prompt, 600, 'claude-sonnet-4-6');
      return this._parseReviewJSON(raw, participant);
    } catch (err) {
      console.error(`Review failed for ${participant.name}:`, err.message);
      return this._fallbackReview(participant);
    }
  }

  _parseReviewJSON(raw, participant) {
    // Strip markdown code fences if present
    let text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');

    // Extract first complete JSON object
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON found in response');

    const jsonStr = text.slice(start, end + 1);
    const data = JSON.parse(jsonStr);

    // Validate and clamp scores
    const scoreKeys = ['communication', 'content', 'leadership', 'listening', 'initiative', 'overall'];
    for (const key of scoreKeys) {
      data.scores[key] = Math.min(10, Math.max(1, Math.round(Number(data.scores[key]) || 5)));
    }

    return {
      candidateId: participant.id,
      candidateName: participant.name,
      isHuman: participant.isHuman || false,
      scores: data.scores,
      feedback: data.feedback || 'No feedback generated.',
      strengths: Array.isArray(data.strengths) ? data.strengths.slice(0, 3) : [],
      improvements: Array.isArray(data.improvements) ? data.improvements.slice(0, 3) : [],
      standoutMoment: data.standoutMoment || null,
    };
  }

  _fallbackReview(participant) {
    return {
      candidateId: participant.id,
      candidateName: participant.name,
      isHuman: participant.isHuman || false,
      scores: { communication: 5, content: 5, leadership: 5, listening: 5, initiative: 5, overall: 5 },
      feedback: 'Review generation failed for this participant. Please try again.',
      strengths: [],
      improvements: ['Review unavailable — re-run the game to get feedback'],
      standoutMoment: null,
    };
  }

  // ─── Core API caller ──────────────────────────────────────────────────────

  async _callAPI(prompt, maxTokens = 200, model = 'claude-haiku-4-5-20251001') {
    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content?.[0];
    if (!block || block.type !== 'text') {
      throw new Error('Unexpected API response format');
    }
    return block.text.trim();
  }
}
