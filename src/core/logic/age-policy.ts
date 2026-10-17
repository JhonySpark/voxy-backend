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
 * TRAVAS DESATIVADAS TEMPORARIAMENTE:
 * Libera acesso para todos os usuários normais, bloqueando apenas
 * contas explicitamente suspensas ou confirmadas como CHILD (<13 anos).
 */
export function canJoinVoiceByAge(params: {
  ageClassification?: string | null;
  isSuspended?: boolean | null;
  birthDate?: Date | string | null;
}): boolean {
  if (params.isSuspended) return false;
  if (params.ageClassification === AgeClassificationEnum.CHILD) return false;
  // Temporariamente liberado para UNKNOWN, TEEN, ADULT e DIVERGENT
  return true;
}
