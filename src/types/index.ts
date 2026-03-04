export type HomeworkStatus = 'pending' | 'submitted' | 'ai_reviewed' | 'graded' | 'resubmit' | 'disputed';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementCategory = 'streak' | 'team_quest' | 'challenge' | 'duel';
export type MascotState = 'sick' | 'sad' | 'neutral' | 'happy' | 'thriving';

export type CharacterBodyType = 'humanoid' | 'quadruped' | 'blob' | 'snowman' | 'bird';

export interface Character3DConfig {
  bodyType: CharacterBodyType;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  scale: number;
  headShape: 'sphere' | 'cube' | 'cone' | 'cylinder';
  hasHorns?: boolean;
  hasTail?: boolean;
  hasWings?: boolean;
  hasCrown?: boolean;
  hasWeapon?: 'sword' | 'bow' | 'staff' | 'shield' | 'guitar';
  modelUrl?: string;
}

export interface ThemeCharacter {
  id: string;
  name: string;
  emoji: string;           // основной эмодзи (аватарка)
  config3d: Character3DConfig;
  mascotEmojis: {          // эмодзи по состояниям здоровья
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
  grade: number; // 5-11
  classId: string;
  mascotHealth: number; // 0-100
  currentStreak: number;
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

export interface Submission {
  id: string;
  homeworkId: string;
  fileUri: string;
  fileType: 'photo' | 'document';
  submittedAt: Date;
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
  grade?: number;
  maxGrade: number;
  aiFeedback?: string;
  teacherFeedback?: string;
  createdAt: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  rarity: AchievementRarity;
  category: AchievementCategory;
  progress: number; // 0-100
  isLocked: boolean;
  unlockedAt?: Date;
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
  characters: ThemeCharacter[];
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
