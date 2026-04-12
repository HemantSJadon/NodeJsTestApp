export type TopicCategory = "below-average" | "average" | "above-average";

export type PhaseNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface Topic {
  id: string;
  name: string;
  category: TopicCategory;
  number: number;
}

export interface PhaseInfo {
  number: PhaseNumber;
  label: string;
  icon: string;
  description: string;
}

export interface CachedPhaseContent {
  topicId: string;
  phase: number;
  content: string;
  createdAt: string;
}

export interface ConceptFireQA {
  question: string;
  answer: string;
}

export interface Phase3Content {
  questions: ConceptFireQA[];
}

export interface GradingResult {
  grade: "ready" | "borderline" | "retry";
  score: number;
  strengths: string[];
  weaknesses: string[];
  corrections: string[];
  overallFeedback: string;
}

export interface GenerateRequest {
  topicId: string;
  topicName: string;
  phase: PhaseNumber;
}

export interface GradeRequest {
  topicId: string;
  topicName: string;
  delivery: string;
  intelBrief?: string;
}

export interface WeakPointRequest {
  topicId: string;
  topicName: string;
  gradingResult: GradingResult;
  delivery: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
}
