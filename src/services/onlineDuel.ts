import { db } from './firebase';
import { ref, set, get, onValue, update } from 'firebase/database';
import { mockDuelQuestions } from '../data/mockData';
import type { DuelQuestion } from '../types';

// Firebase RTDB strips null values, so we use -1 to mean "not answered"
const NOT_ANSWERED = -1;

export interface OnlinePlayer {
  id: string;
  name: string;
  avatarEmoji: string;
  answers: number[];
  score: number;
}

export interface OnlineRoom {
  code: string;
  subject: string;
  status: 'waiting' | 'active' | 'finished';
  questionIds: string[];
  player1: OnlinePlayer;
  player2: OnlinePlayer | null;
}

function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function pickQuestions(subject: string, count = 5): DuelQuestion[] {
  return mockDuelQuestions
    .filter((q) => q.subject === subject)
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
}

export function getQuestionsForRoom(questionIds: string[] | undefined): DuelQuestion[] {
  if (!questionIds || !Array.isArray(questionIds)) return [];
  return questionIds
    .map((id) => mockDuelQuestions.find((q) => q.id === id))
    .filter((q): q is DuelQuestion => q != null);
}

export async function createRoom(
  subject: string,
  player: { id: string; name: string; avatarEmoji: string },
): Promise<string> {
  const code = generateCode();
  const questions = pickQuestions(subject);
  const emptyAnswers = questions.map(() => NOT_ANSWERED);

  const room = {
    code,
    subject,
    status: 'waiting',
    questionIds: questions.map((q) => q.id),
    player1: { ...player, answers: emptyAnswers, score: 0 },
  };

  await set(ref(db, `rooms/${code}`), room);
  return code;
}

export async function joinRoom(
  code: string,
  player: { id: string; name: string; avatarEmoji: string },
): Promise<OnlineRoom | null> {
  const snapshot = await get(ref(db, `rooms/${code}`));
  if (!snapshot.exists()) return null;

  const room = snapshot.val() as OnlineRoom;
  if (room.status !== 'waiting') return null;
  if (room.player1.id === player.id) return null;

  const questionIds = room.questionIds || [];
  const emptyAnswers = questionIds.map(() => NOT_ANSWERED);
  const player2: OnlinePlayer = { ...player, answers: emptyAnswers, score: 0 };

  await update(ref(db, `rooms/${code}`), {
    player2,
    status: 'active',
  });

  return { ...room, player2, status: 'active' };
}

export async function submitAnswer(
  code: string,
  playerKey: 'player1' | 'player2',
  questionIndex: number,
  answerIndex: number,
  isCorrect: boolean,
  currentScore: number,
): Promise<void> {
  await update(ref(db, `rooms/${code}/${playerKey}`), {
    [`answers/${questionIndex}`]: answerIndex,
    score: currentScore + (isCorrect ? 1 : 0),
  });
}

export async function finishRoom(code: string): Promise<void> {
  await update(ref(db, `rooms/${code}`), { status: 'finished' });
}

export function isAnswered(answer: number | undefined): boolean {
  return answer !== undefined && answer !== NOT_ANSWERED;
}

export function subscribeToRoom(
  code: string,
  callback: (room: OnlineRoom | null) => void,
): () => void {
  const roomRef = ref(db, `rooms/${code}`);
  return onValue(roomRef, (snapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as OnlineRoom) : null);
  });
}
