import { AgeClassificationEnum } from '../enums/index.js';

/**
 * Data a partir da qual usuários UNKNOWN (sem validação do SO) passam a ser
 * bloqueados em voz. Antes disso vale um período de carência, para que clientes
 * já instalados (que não revalidam sozinhos) tenham tempo de atualizar.
 * Pode ser sobrescrita via env AGE_ENFORCEMENT_START (ISO 8601).
 */
export function getAgeEnforcementStart(): Date {
  const raw = process.env.AGE_ENFORCEMENT_START;
  const parsed = raw ? new Date(raw) : null;
  if (parsed && !Number.isNaN(parsed.getTime())) return parsed;
  return new Date('2026-10-22T00:00:00-03:00');
}

export function isUnknownGraceActive(now: Date = new Date()): boolean {
  return now.getTime() < getAgeEnforcementStart().getTime();
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
 * - ADULT / TEEN / DIVERGENT (opera como TEEN): liberado
 * - UNKNOWN: bloqueado, exceto durante a carência e se a idade declarada for >= 13
 * - CHILD / suspenso: bloqueado
 */
export function canJoinVoiceByAge(params: {
  ageClassification?: string | null;
  isSuspended?: boolean | null;
  birthDate?: Date | string | null;
}): boolean {
  if (params.isSuspended) return false;
  switch (params.ageClassification) {
    case AgeClassificationEnum.ADULT:
    case AgeClassificationEnum.TEEN:
    case AgeClassificationEnum.DIVERGENT:
      return true;
    case AgeClassificationEnum.UNKNOWN: {
      if (!isUnknownGraceActive()) return false;
      const declared = getDeclaredAgeCategory(params.birthDate);
      return declared === 'TEEN' || declared === 'ADULT';
    }
    default:
      return false;
  }
}
