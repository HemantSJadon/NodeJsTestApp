import { v4 as uuidv4 } from 'uuid';

// Fisher-Yates shuffle — unbiased
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CANDIDATE_POOL = [
  {
    name: 'Arjun Mehta',
    background: 'Software Engineer at a Series-B fintech startup, IIT Delhi grad, 3 years experience in product development',
    personality: 'assertive',
    avatarColor: '#4F46E5',
    voiceGender: 'male',
  },
  {
    name: 'Priya Sharma',
    background: 'Financial analyst at Deloitte, CA Inter qualified, 4 years in M&A advisory across BFSI sector',
    personality: 'analytical',
    avatarColor: '#7C3AED',
    voiceGender: 'female',
  },
  {
    name: 'Rahul Verma',
    background: 'Key Account Manager at HUL, 5 years in rural distribution and FMCG go-to-market strategy',
    personality: 'collaborative',
    avatarColor: '#2563EB',
    voiceGender: 'male',
  },
  {
    name: 'Sneha Iyer',
    background: 'Strategy Consultant at McKinsey Bengaluru, 3 years post-graduation from IIM Calcutta',
    personality: 'devil_advocate',
    avatarColor: '#DC2626',
    voiceGender: 'female',
  },
  {
    name: 'Vikram Nair',
    background: 'Deputy Superintendent of Police, Indian Police Service, 4 years in law enforcement and public policy',
    personality: 'quiet',
    avatarColor: '#059669',
    voiceGender: 'male',
  },
  {
    name: 'Kavya Reddy',
    background: 'Senior Reporter at The Economic Times, 6 years covering macroeconomics and corporate affairs',
    personality: 'verbose',
    avatarColor: '#D97706',
    voiceGender: 'female',
  },
  {
    name: 'Ankit Joshi',
    background: 'Operations Manager at Tata Steel, 4 years in supply chain optimisation and lean manufacturing',
    personality: 'analytical',
    avatarColor: '#0891B2',
    voiceGender: 'male',
  },
  {
    name: 'Meera Krishnan',
    background: 'Program Director at GiveIndia Foundation, 5 years in social enterprise and grassroots development',
    personality: 'collaborative',
    avatarColor: '#BE185D',
    voiceGender: 'female',
  },
  {
    name: 'Rohan Gupta',
    background: 'Growth Lead at a D2C e-commerce brand, ex-BCG analyst, 4 years experience',
    personality: 'assertive',
    avatarColor: '#7C2D12',
    voiceGender: 'male',
  },
  {
    name: 'Divya Singh',
    background: 'Research Fellow at NIPFP (National Institute of Public Finance and Policy), economics PhD aspirant',
    personality: 'devil_advocate',
    avatarColor: '#0F766E',
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

export const PANEL_TYPE_META = {
  collaborative: {
    label: 'Collaborative Panel',
    description: 'Everyone builds on each other — supportive, constructive, consensus-oriented',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  competitive: {
    label: 'Competitive Panel',
    description: 'Each candidate vies to impress — polite but assertive, individual-focused',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  hostile: {
    label: 'Hostile Panel',
    description: 'Aggressive dynamics — challenges, interruptions, egos on display',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  mixed: {
    label: 'Mixed Panel',
    description: 'Realistic balance of personalities — closest to actual MBA GD scenarios',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
};

export function generateCandidates(count, panelType) {
  const n = Math.min(Math.max(count, 3), CANDIDATE_POOL.length);
  const selected = shuffle(CANDIDATE_POOL).slice(0, n);

  return selected.map((template, index) => ({
    id: uuidv4(),
    name: template.name,
    background: template.background,
    personality: template.personality,
    isHuman: false,
    avatarColor: template.avatarColor,
    voiceGender: template.voiceGender,
    voiceIndex: index + 1, // 0 reserved for moderator
    speakingCount: 0,
    totalWords: 0,
    lastSpoke: 0,
    stance: null, // assigned by aiEngine.assignStances
  }));
}
