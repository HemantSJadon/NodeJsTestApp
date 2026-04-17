import { v4 as uuidv4 } from 'uuid';

const CANDIDATE_POOL = [
  {
    name: 'Arjun Sharma',
    background: 'Software engineer at a top tech startup, 3 years experience, IIT Bombay graduate',
    personality: 'assertive',
    description: 'Confident and direct, often takes leadership, speaks clearly with structured arguments',
    avatarColor: '#4F46E5',
    voiceGender: 'male',
  },
  {
    name: 'Priya Mehta',
    background: 'Financial analyst at KPMG, 4 years in consulting, CA qualified',
    personality: 'analytical',
    description: 'Data-driven, logical, references facts and examples, methodical thinker',
    avatarColor: '#7C3AED',
    voiceGender: 'female',
  },
  {
    name: 'Rahul Gupta',
    background: 'Sales manager at leading FMCG company, 5 years in B2B sales',
    personality: 'collaborative',
    description: 'Builds on others points, acknowledges good ideas, bridges different perspectives',
    avatarColor: '#2563EB',
    voiceGender: 'male',
  },
  {
    name: 'Sneha Patel',
    background: 'Management consultant at McKinsey, 2 years post MBA from IIM Ahmedabad',
    personality: 'devil_advocate',
    description: 'Challenges assumptions, presents counterarguments, probes weak reasoning',
    avatarColor: '#DC2626',
    voiceGender: 'female',
  },
  {
    name: 'Vikram Singh',
    background: 'IPS officer with 3 years experience, worked on policy implementation',
    personality: 'quiet',
    description: 'Thoughtful, speaks rarely but with impact, listens carefully before responding',
    avatarColor: '#059669',
    voiceGender: 'male',
  },
  {
    name: 'Kavya Nair',
    background: 'Senior journalist at NDTV, 6 years covering business and economics',
    personality: 'verbose',
    description: 'Enthusiastic and expressive, tends to elaborate, storyteller, sometimes goes off on tangents',
    avatarColor: '#D97706',
    voiceGender: 'female',
  },
  {
    name: 'Ankit Joshi',
    background: 'Operations head at mid-size manufacturing firm, 4 years experience',
    personality: 'analytical',
    description: 'Process-oriented, practical examples from industry, focuses on implementation',
    avatarColor: '#0891B2',
    voiceGender: 'male',
  },
  {
    name: 'Meera Krishnan',
    background: 'NGO sector for 5 years, worked with rural development programs',
    personality: 'collaborative',
    description: 'Brings social perspective, empathetic, bridges macro and grassroots realities',
    avatarColor: '#BE185D',
    voiceGender: 'female',
  },
];

export const PERSONALITY_LABELS = {
  assertive: 'Leader',
  analytical: 'Analyst',
  collaborative: 'Team Player',
  devil_advocate: 'Challenger',
  quiet: 'Strategist',
  verbose: 'Communicator',
};

export const PANEL_TYPE_DESCRIPTIONS = {
  collaborative: 'Everyone is respectful and constructive — a supportive group discussion',
  competitive: 'Each participant is vying to stand out and impress the moderator',
  hostile: 'Aggressive dynamics — frequent interruptions and strong challenges',
  mixed: 'Realistic mix — some collaboration, some competition, varied personalities',
};

export function generateCandidates(count, panelType) {
  const shuffled = [...CANDIDATE_POOL].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, CANDIDATE_POOL.length));

  return selected.map((template, index) => ({
    id: uuidv4(),
    name: template.name,
    background: template.background,
    personality: template.personality,
    description: template.description,
    isHuman: false,
    avatarColor: template.avatarColor,
    voiceGender: template.voiceGender,
    voiceIndex: index + 1,
    speakingCount: 0,
    lastSpoke: 0,
  }));
}
