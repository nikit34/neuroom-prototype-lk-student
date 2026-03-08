export type HomeworkStatus = 'pending' | 'submitted' | 'ai_reviewed' | 'graded' | 'resubmit' | 'disputed';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementCategory = 'early_streak' | 'team_quest' | 'challenge' | 'duel' | 'homework';
export type MascotState = 'sick' | 'sad' | 'neutral' | 'happy' | 'thriving';

export type MascotEmotion =
  | 'happy' | 'thinking' | 'surprised' | 'tired' | 'celebrating'
  | 'encouraging' | 'explaining' | 'proud' | 'confused' | 'focused'
  | 'sad' | 'sick' | 'waving' | 'neutral' | 'excited';

export interface ThemeCharacter {
  id: string;
  name: string;
  emoji: string;
  mascotEmojis: {
    sick: string;
    sad: string;
    neutral: string;
    happy: string;
    thriving: string;
  };
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  grade: number;
  classId: string;
  mascotHealth: number;
  earlyStreak: number;
  xpMultiplier: number;
  avatarUrl?: string;
  totalPoints: number;
  characterId?: string;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  subject: string;
  avatarUrl?: string;
}

export interface SubmissionFile {
  uri: string;
  type: 'photo' | 'document';
}

export interface Submission {
  id: string;
  homeworkId: string;
  files: SubmissionFile[];
  submittedAt: Date;
}

export interface HomeworkAttachment {
  uri: string;
  type: 'photo' | 'document';
}

export interface HomeworkAssignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  teacher: Teacher;
  deadline: Date;
  status: HomeworkStatus;
  submissions: Submission[];
  attachments?: HomeworkAttachment[];
  grade?: number;
  maxGrade: number;
  aiFeedback?: string;
  teacherFeedback?: string;
  classmateSubmittedCount?: number;
  totalClassmates?: number;
  createdAt: Date;
}

export type AchievementSource =
  | { type: 'homework'; homeworkId: string; homeworkTitle: string; subject: string; grade?: number; maxGrade?: number; solutionSummary: string }
  | { type: 'early_streak'; earlyCount: number; description: string }
  | { type: 'duel'; opponentName: string; subject: string; result: string }
  | { type: 'quest'; questTitle: string; teamMembers?: string[]; description: string };

export type AchievementTier = 'bronze' | 'silver' | 'gold';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: AchievementCategory;
  progress: number;
  isLocked: boolean;
  unlockedAt?: Date;
  source?: AchievementSource;
  tier?: AchievementTier;
  tierThresholds?: { bronze: number; silver: number; gold: number };
}

export interface Badge {
  id: string;
  icon: string;
  title: string;
  description: string;
  rarity: AchievementRarity;
  category: AchievementCategory;
  achievementId: string;
  tier?: AchievementTier;
  earnedAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isStudent: boolean;
}

export interface DuelChallenge {
  id: string;
  opponentName: string;
  subject: string;
  status: 'pending' | 'active' | 'won' | 'lost';
  score?: { student: number; opponent: number };
}

export interface AppTheme {
  id: string;
  name: string;
  emoji: string;
  ageGroup: 'junior' | 'senior';
  backgroundEmojis: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    overdue: string;
    success: string;
    warning: string;
    gradient: [string, string];
    tabBar: string;
    tabBarActive: string;
    tabBarInactive: string;
    card: string;
    border: string;
  };
}

export interface Classmate {
  id: string;
  firstName: string;
  lastName: string;
  totalPoints: number;
  avatarEmoji: string;
}

// ─── Arena Types ─────────────────────────────────────────────────

// Duels
export type DuelType = 'classmate' | 'cross_class' | 'team';
export type DuelStatus = 'pending' | 'active' | 'finished';
export type DuelResult = 'won' | 'lost' | 'draw' | null;

export interface DuelQuestion {
  id: string;
  subject: string;
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
}

export interface DuelParticipant {
  id: string;
  name: string;
  avatarEmoji: string;
  score: number;
  answers: (number | null)[];
}

export interface DuelTeam {
  id: string;
  name: string;
  members: DuelParticipant[];
  totalScore: number;
}

export interface Duel {
  id: string;
  type: DuelType;
  subject: string;
  status: DuelStatus;
  result: DuelResult;
  challenger: DuelParticipant;
  opponent: DuelParticipant;
  teams?: [DuelTeam, DuelTeam];
  questions: DuelQuestion[];
  currentQuestionIndex: number;
  xpReward: number;
  createdAt: Date;
  isIncoming: boolean;
}

// Quests
export type QuestStatus = 'available' | 'active' | 'completed';

export interface QuestStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
}

export interface QuestTeamMember {
  id: string;
  name: string;
  avatarEmoji: string;
  contribution: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  subject: string;
  status: QuestStatus;
  steps: QuestStep[];
  teamMembers: QuestTeamMember[];
  xpReward: number;
  deadline: Date;
  createdAt: Date;
}

// Challenges
export type ChallengeStatus = 'available' | 'active' | 'completed' | 'expired';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export interface ChallengeReward {
  xp: number;
  badge?: { icon: string; title: string };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: ChallengeDifficulty;
  status: ChallengeStatus;
  progress: number;
  target: number;
  reward: ChallengeReward;
  deadline: Date;
  createdAt: Date;
}

export interface LootChestResult {
  type: 'xp';
  amount: number;
}

// ─── Appeals ────────────────────────────────────────────────────
export type AppealStatus = 'default' | 'pending' | 'accepted' | 'rejected' | 'mixed' | 'expired';

export interface AppealTaskResponse {
  taskLabel: string;
  decision: 'agree' | 'disagree';
  teacherComment?: string;
}

export interface Appeal {
  homeworkId: string;
  status: AppealStatus;
  disagreementPoints: string[];
  reviewType: 'whole' | 'specific';
  comment: string;
  submittedAt: Date;
  oldGrade?: number;
  newGrade?: number;
  teacherComment?: string;
  teacherTaskResponses?: AppealTaskResponse[];
  decisionDate?: string;
}

// ─── Notifications ──────────────────────────────────────────────
export type NotificationType = 'chat_reply' | 'duel_challenge' | 'homework_graded' | 'duel_result';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  isRead: boolean;
  createdAt: Date;
  /** Navigation target */
  route?: string;
}
