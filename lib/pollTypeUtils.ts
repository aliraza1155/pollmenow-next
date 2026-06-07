// lib/pollTypeUtils.ts
import { POLL_TYPES } from './constants';

export function getPollTypeConfig(type: string) {
  return POLL_TYPES.find(t => t.value === type) || POLL_TYPES[0];
}

export function getPollTypeDescription(type: string): string {
  const config = getPollTypeConfig(type);
  return config.description || 'Custom poll type';
}

export function canEditOptions(type: string): boolean {
  return type !== 'yesno' && type !== 'rating';
}

export function shouldShowOptions(type: string): boolean {
  return type !== 'rating';
}