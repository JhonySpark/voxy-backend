/**
 * Catálogo central de Aliases de Templates do Resend para o Voxy.
 * Evita poluição de variáveis de ambiente no .env para cada e-mail disparado.
 */
export const RESEND_TEMPLATES = {
  /**
   * Template de verificação de conta (código de 6 dígitos).
   * Alias configurado no painel da Resend.
   */
  EMAIL_VERIFICATION: 'voxy-email-verification',
} as const;
