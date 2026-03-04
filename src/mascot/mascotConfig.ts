import { MascotEmotion, MascotState } from '../types';

export const MASCOT_EMOJIS: Record<MascotEmotion, string> = {
  happy: '😊',
  thinking: '🤔',
  surprised: '😮',
  tired: '😴',
  celebrating: '🎉',
  encouraging: '💪',
  explaining: '🧠',
  proud: '😎',
  confused: '😵‍💫',
  focused: '🎯',
  sad: '😢',
  sick: '🤒',
  waving: '👋',
  neutral: '😐',
  excited: '🤩',
};

export function stateToEmotion(state: MascotState): MascotEmotion {
  switch (state) {
    case 'sick': return 'sick';
    case 'sad': return 'sad';
    case 'neutral': return 'neutral';
    case 'happy': return 'happy';
    case 'thriving': return 'excited';
  }
}
