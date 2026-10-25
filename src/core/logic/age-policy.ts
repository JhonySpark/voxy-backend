import { AgeClassificationEnum } from '../enums/index.js';

/**
 * Política de acesso a chamadas de voz e compartilhamento de tela de jogos por idade.
 * O prazo de carência foi removido definitivamente:
 * Todos os usuários (ADULT, TEEN, DIVERGENT e UNKNOWN) têm permissão liberada
 * para chamadas de voz e compartilhamento/transmissão de jogos detectados,
 * bloqueando apenas contas explicitamente suspensas ou confirmadas como CHILD (<13 anos).
 */
export function getAgeEnforcementStart(): Date | null {
  // Prazo de carência desativado permanentemente: sem prazo limite
  return null;
}

export function isUnknownGraceActive(_now: Date = new Date()): boolean {
  // Sempre ativo / sem prazo expiratório
  return true;
}

export type DeclaredAgeCategory = 'CHILD' | 'TEEN' | 'ADULT' | null;

export function getDeclaredAgeCategory(birthDate?: Date | string | null): DeclaredAgeCategory {
  if (!birthDate) return null;
  const bDate = new Date(birthDate);
  if (Number.isNaN(bDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - bDate.getFullYear();
  const m = today.getMonth() - bDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) age--;
  if (age < 13) return 'CHILD';
  if (age < 18) return 'TEEN';
  return 'ADULT';
}

/**
 * Regra única de acesso a chamadas de voz por idade.
 * Libera acesso para todos os usuários normais (incluindo UNKNOWN),
 * bloqueando apenas contas explicitamente suspensas ou confirmadas como CHILD (<13 anos).
 */
export function canJoinVoiceByAge(params: {
  ageClassification?: string | null;
  isSuspended?: boolean | null;
  birthDate?: Date | string | null;
}): boolean {
  if (params.isSuspended) return false;
  if (params.ageClassification === AgeClassificationEnum.CHILD) return false;
  return true;
}

/**
 * Regra de acesso para compartilhamento / streaming de jogos por idade.
 * Libera para ADULT, TEEN, DIVERGENT e UNKNOWN (sem limite de prazo).
 * Apenas contas suspensas ou CHILD (<13 anos) são bloqueadas.
 */
export function canStreamGamesByAge(params: {
  ageClassification?: string | null;
  isSuspended?: boolean | null;
}): boolean {
  if (params.isSuspended) return false;
  if (params.ageClassification === AgeClassificationEnum.CHILD) return false;
  return true;
}

