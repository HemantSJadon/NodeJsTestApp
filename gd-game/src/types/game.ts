export type PanelType = 'collaborative' | 'competitive' | 'hostile' | 'mixed';
export type Phase =
  | 'lobby'
  | 'intro'
  | 'thinking'
  | 'discussion'
  | 'closing'
  | 'generating-review'
  | 'review';

export interface Candidate {
  id: string;
  name: string;
  background: string;
  personality: string;
  description: string;
  isHuman: boolean;
  avatarColor: string;
  voiceGender: string;
  voiceIndex: number;
  speakingCount: number;
  lastSpoke: number;
}

export interface Message {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: number;
  isHuman: boolean;
  isModerator: boolean;
}

export interface ReviewScores {
  communication: number;
  content: number;
  leadership: number;
  listening: number;
  initiative: number;
  overall: number;
}

export interface Review {
  candidateId: string;
  candidateName: string;
  isHuman: boolean;
  scores: ReviewScores;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface Room {
  id: string;
  topic: string;
  panelType: PanelType;
  phase: Phase;
  candidates: Candidate[];
  messages: Message[];
  createdAt: number;
  discussionDuration: number;
  humanName: string;
  reviews: Review[] | null;
}

export interface RoomSummary {
  id: string;
  topic: string;
  panelType: PanelType;
  phase: Phase;
  candidateCount: number;
  createdAt: number;
  humanName: string;
  discussionDuration: number;
}
