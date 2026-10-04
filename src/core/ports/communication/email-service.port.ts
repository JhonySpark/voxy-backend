export const EMAIL_SERVICE_PORT = Symbol('EMAIL_SERVICE_PORT');

export interface SendVerificationEmailInput {
  to: string;
  username: string;
  code: string;
}

export interface IEmailServicePort {
  sendVerificationEmail(input: SendVerificationEmailInput): Promise<{ success: boolean; messageId?: string }>;
}
