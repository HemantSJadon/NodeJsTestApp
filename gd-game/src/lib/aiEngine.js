import Anthropic from '@anthropic-ai/sdk';

const PANEL_INSTRUCTIONS = {
  collaborative: 'This is a COLLABORATIVE panel. Candidates build on each other\'s ideas, acknowledge good points, and work toward a consensus. The tone is respectful and constructive.',
  competitive: 'This is a COMPETITIVE panel. Candidates are vying to impress the moderator. They politely challenge others, try to bring in unique angles, and showcase individual expertise.',
  hostile: 'This is a HOSTILE panel. Candidates frequently interrupt (shown by "—"), challenge points aggressively, and try to dominate. Still within professional bounds, but tense.',
  mixed: 'This is a MIXED panel with realistic group dynamics — moments of collaboration, some competition, occasional challenges. The most realistic scenario.',
};

const PERSONALITY_INSTRUCTIONS = {
  assertive: 'You are assertive and confident. You speak first when possible, use phrases like "I firmly believe", "The key point here is", take leadership naturally. Keep points crisp and direct.',
  analytical: 'You are analytical and data-driven. You cite examples, reference statistics or case studies, structure arguments logically. Use phrases like "Research shows", "Looking at the data", "The structured approach would be".',
  collaborative: 'You are collaborative and inclusive. You often acknowledge others\' points before adding your own. Use phrases like "Building on what [name] said", "That\'s an excellent point, and adding to it", "I agree with the earlier observation about".',
  devil_advocate: 'You challenge assumptions and probe weak logic. Use phrases like "But have we considered", "I\'d push back on that", "The counterargument here is", "While that sounds good in theory". Be respectful but challenging.',
  quiet: 'You are thoughtful and speak seldom, but when you do, it\'s high-impact. Start with "I\'ve been listening and", "One thing I haven\'t heard yet is", or similar. Make each contribution count. Keep it short.',
  verbose: 'You are enthusiastic and sometimes go into storytelling mode. You use relatable examples, anecdotes, or references. Can be slightly tangential but ultimately relevant. Slightly longer contributions.',
};

export class AIEngine {
  constructor(apiKey) {
    this.client = new Anthropic({ apiKey });
  }

  async generateModeratorIntro(room) {
    const prompt = `You are a professional moderator conducting an MBA admissions group discussion.

Topic: "${room.topic}"
Number of candidates: ${room.candidates.length}
Panel type: ${room.panelType}

Generate a natural, professional moderator introduction (under 90 words) that:
1. Welcomes candidates warmly
2. States the topic clearly
3. Mentions they have 2 minutes to think before discussion begins
4. States the discussion will run for ${Math.round(room.discussionDuration / 60000)} minutes
5. Reminds candidates to be respectful and take turns

Respond ONLY with the moderator's spoken words:`;

    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 220,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text.trim();
  }

  async generateCandidateUtterance(room, candidate) {
    const recentMessages = room.messages.slice(-12);
    const conversationHistory = recentMessages
      .map((m) => `${m.speakerName}: ${m.text}`)
      .join('\n');

    const lastSpeaker = recentMessages[recentMessages.length - 1];

    const prompt = `You are ${candidate.name} in an MBA group discussion.
Background: ${candidate.background}
Personality style: ${PERSONALITY_INSTRUCTIONS[candidate.personality]}

${PANEL_INSTRUCTIONS[room.panelType]}

Discussion topic: "${room.topic}"

Recent conversation:
${conversationHistory || '(The discussion is just beginning.)'}

${lastSpeaker ? `The last person who spoke was: ${lastSpeaker.speakerName}` : ''}

It is now YOUR turn to speak. Generate ONE natural contribution (2-4 sentences, max 65 words).
Requirements:
- React naturally to what was just said if relevant
- Add a NEW angle, point, or challenge — do NOT repeat points already made
- Stay firmly on the discussion topic
- Show your personality through word choice and style
- Do NOT use meta phrases like "As an MBA candidate" or "I would like to say"
- NEVER include attribution — just the words you speak

Respond with ONLY what ${candidate.name} says:`;

    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 160,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text.trim();
  }

  async generateModeratorIntervention(room) {
    const conversationHistory = room.messages
      .slice(-10)
      .map((m) => `${m.speakerName}: ${m.text}`)
      .join('\n');

    const humanHasSpoken = room.messages.some((m) => m.isHuman);
    const humanRecentMessages = room.messages.filter((m) => m.isHuman).length;
    const totalMessages = room.messages.filter((m) => !m.isModerator).length;

    const shouldNudgeHuman =
      !humanHasSpoken && totalMessages > 4
        ? `The human candidate (${room.humanName}) has NOT spoken yet. Gently invite them by name.`
        : humanRecentMessages < totalMessages * 0.15 && totalMessages > 6
        ? `The human candidate (${room.humanName}) has spoken very little. Consider inviting them.`
        : '';

    const prompt = `You are the moderator of an MBA group discussion.
Topic: "${room.topic}"
Panel type: ${room.panelType}

Recent conversation:
${conversationHistory}

${shouldNudgeHuman}

As moderator, decide if an intervention is needed. You may:
- Keep the discussion on track if it drifted
- Invite a quiet participant by name
- Note time is running out (say this max once)
- Acknowledge a good point and push the discussion further

Generate ONE brief moderator comment (1-2 sentences, max 35 words) OR respond with exactly "SKIP" if no intervention is needed right now.
Respond with SKIP approximately 65% of the time unless there's a clear need.

Response:`;

    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 90,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    if (text.toUpperCase().startsWith('SKIP')) return null;
    return text;
  }

  async generateClosingStatement(room, candidate) {
    const candidateMessages = room.messages
      .filter((m) => m.speakerId === candidate.id)
      .map((m) => m.text)
      .join(' ');

    const prompt = `You are ${candidate.name} in an MBA group discussion about "${room.topic}".
Your personality: ${PERSONALITY_INSTRUCTIONS[candidate.personality]}

Your contributions during the discussion:
${candidateMessages || '(You were quiet for most of the discussion.)'}

Generate ONE memorable closing statement (1-2 sentences, max 40 words) that:
- Captures your core position or insight
- Is confident and leaves an impression
- Fits your personality style

Respond with ONLY what ${candidate.name} says:`;

    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text.trim();
  }

  async generateHumanClosingPrompt(room) {
    return `${room.humanName}, we'd love to hear your closing thought. What's your key takeaway from this discussion?`;
  }

  async generateReviews(room) {
    const fullTranscript = room.messages
      .map((m) => `${m.speakerName}: ${m.text}`)
      .join('\n');

    const allParticipants = [
      ...room.candidates,
      {
        id: 'human',
        name: room.humanName,
        isHuman: true,
        personality: 'human',
        background: 'Human candidate being evaluated',
      },
    ];

    const reviews = await Promise.all(
      allParticipants.map(async (participant) => {
        const participantMessages = room.messages
          .filter((m) => m.speakerId === participant.id || (participant.isHuman && m.isHuman))
          .map((m) => m.text)
          .join('\n');

        const totalTurns = room.messages.filter(
          (m) => m.speakerId === participant.id || (participant.isHuman && m.isHuman)
        ).length;

        const prompt = `You are a senior MBA admissions panelist evaluating a group discussion candidate.

Discussion topic: "${room.topic}"
Panel type: ${room.panelType}
Total discussion turns by this candidate: ${totalTurns}

Full discussion transcript:
${fullTranscript}

Candidate being evaluated: ${participant.name}
${participant.isHuman ? '(This is the HUMAN candidate — the focus of this evaluation)' : `Personality type: ${participant.personality}`}

Their contributions:
${participantMessages || '(This candidate did not speak during the discussion.)'}

Evaluate this candidate rigorously and fairly. Consider:
- Communication: clarity, articulation, conciseness
- Content: depth, relevance, factual accuracy
- Leadership: initiative, direction-setting, confidence
- Listening: acknowledgment of others, building on points
- Initiative: frequency of speaking, first-mover moments

Return ONLY valid JSON with this exact structure:
{
  "scores": {
    "communication": <integer 1-10>,
    "content": <integer 1-10>,
    "leadership": <integer 1-10>,
    "listening": <integer 1-10>,
    "initiative": <integer 1-10>,
    "overall": <integer 1-10>
  },
  "feedback": "<2-3 sentences of honest overall assessment>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific area to improve 1>", "<specific area to improve 2>"]
}`;

        try {
          const response = await this.client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 450,
            messages: [{ role: 'user', content: prompt }],
          });

          const rawText = response.content[0].text.trim();
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          const reviewData = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

          return {
            candidateId: participant.id,
            candidateName: participant.name,
            isHuman: participant.isHuman || false,
            ...reviewData,
          };
        } catch (error) {
          console.error('Review generation error for', participant.name, error.message);
          return {
            candidateId: participant.id,
            candidateName: participant.name,
            isHuman: participant.isHuman || false,
            scores: {
              communication: 5,
              content: 5,
              leadership: 5,
              listening: 5,
              initiative: 5,
              overall: 5,
            },
            feedback: 'Review could not be generated for this participant.',
            strengths: ['Participated in the discussion'],
            improvements: ['Review data unavailable'],
          };
        }
      })
    );

    return reviews;
  }
}
