import { Injectable, Logger } from '@nestjs/common';
import { IEmailServicePort, SendVerificationEmailInput } from '../../../core/ports/communication/email-service.port.js';
import { AppEnvironmentConfig } from '../../../core/config/index.js';

@Injectable()
export class ResendEmailAdapter implements IEmailServicePort {
  private readonly logger = new Logger(ResendEmailAdapter.name);

  async sendVerificationEmail(input: SendVerificationEmailInput): Promise<{ success: boolean; messageId?: string }> {
    const apiKey = (process.env.RESEND_API_KEY || AppEnvironmentConfig.resend.apiKey || '')
      .trim()
      .replace(/^["']|["']$/g, '');
    const fromEmail = (process.env.RESEND_FROM_EMAIL || AppEnvironmentConfig.resend.fromEmail || 'Voxy <onboarding@resend.dev>')
      .trim()
      .replace(/^["']|["']$/g, '');
    const apiUrl = (process.env.RESEND_API_URL || AppEnvironmentConfig.resend.apiUrl || 'https://api.resend.com/emails')
      .trim();

    if (!apiKey) {
      this.logger.warn(
        `\n=================================================================\n` +
        ` [VOXY EMAIL] RESEND_API_KEY não configurada ou vazia no .env\n` +
        ` Destinatário: ${input.to} (${input.username})\n` +
        ` CÓDIGO DE VERIFICAÇÃO: >>> ${input.code} <<<\n` +
        `=================================================================\n`
      );
      return { success: true, messageId: 'mock-dev-id' };
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0e14; color: #f1f5f9; margin: 0; padding: 30px; }
            .container { max-width: 500px; margin: 0 auto; background: #121824; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .header { text-align: center; margin-bottom: 24px; }
            .brand { font-size: 26px; font-weight: 800; color: #34d399; letter-spacing: -0.5px; }
            .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 16px; margin-bottom: 8px; }
            .subtitle { font-size: 14px; color: #94a3b8; line-height: 1.5; }
            .code-box { background: #1a2234; border: 2px dashed #34d399; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
            .code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #34d399; font-family: monospace; }
            .info { font-size: 13px; color: #64748b; line-height: 1.5; text-align: center; }
            .footer { margin-top: 32px; font-size: 12px; color: #475569; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="brand">VOXY</div>
              <h1 class="title">Verifique seu endereço de e-mail</h1>
              <p class="subtitle">Olá, <strong>${input.username}</strong>! Use o código de 6 dígitos abaixo para confirmar sua conta no Voxy.</p>
            </div>
            <div class="code-box">
              <div class="code">${input.code}</div>
            </div>
            <p class="info">Este código expira em 15 minutos. Se você não solicitou este cadastro, ignore esta mensagem com segurança.</p>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Voxy. Todos os direitos reservados.
            </div>
          </div>
        </body>
        </html>
      `;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [input.to],
          subject: `${input.code} é o seu código de verificação Voxy`,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        this.logger.error(`Erro ao disparar e-mail via Resend: ${JSON.stringify(errData)}`);
        return { success: false };
      }

      const data = await response.json();
      this.logger.log(`E-mail de verificação enviado via Resend para ${input.to} (ID: ${data.id})`);
      return { success: true, messageId: data.id };
    } catch (err: any) {
      this.logger.error(`Falha no envio de e-mail via Resend: ${err.message}`, err.stack);
      return { success: false };
    }
  }
}
