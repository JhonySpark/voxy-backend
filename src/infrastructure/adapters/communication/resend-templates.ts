/**
 * Catálogo central de Aliases de Templates do Resend para o Voxy.
 * Evita poluição de variáveis de ambiente no .env para cada e-mail disparado.
 */
export const RESEND_TEMPLATES = {
  // 1. Autenticação & Conta
  EMAIL_VERIFICATION: 'voxy-email-verification',
  WELCOME: 'voxy-welcome',
  PASSWORD_RESET: 'voxy-password-reset',
  PASSWORD_CHANGED: 'voxy-password-changed',
  NEW_LOGIN_ALERT: 'voxy-new-login-alert',

  // 2. Proteção Parental (Age Signal Protocol)
  PARENTAL_CONSENT: 'voxy-parental-consent',
  PARENTAL_ALERT: 'voxy-parental-security-alert',

  // 3. Social & Comunidade
  SERVER_INVITE: 'voxy-server-invite',
  FRIEND_REQUEST: 'voxy-friend-request-digest',
  UNREAD_DIGEST: 'voxy-unread-digest',

  // 4. Ciclo de Vida & LGPD
  ACCOUNT_DELETION: 'voxy-account-deletion',
  DATA_RETENTION: 'voxy-data-retention-notice',
} as const;

