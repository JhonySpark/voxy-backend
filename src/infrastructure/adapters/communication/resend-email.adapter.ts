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
      const digits = (input.code || '000000').split('');
      const digitsHtml = digits.map((d) => `
        <td style="padding: 0 4px;">
          <div style="width: 44px; height: 54px; background-color: #070a13; border: 1.5px solid rgba(52, 211, 153, 0.5); border-radius: 10px; font-size: 28px; font-weight: 800; color: #34d399; text-align: center; line-height: 54px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);">
            ${d}
          </div>
        </td>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Verificação - Voxy</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060911; color: #f8fafc; margin: 0; padding: 24px; -webkit-font-smoothing: antialiased; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #060911; padding-bottom: 30px; }
            .container { max-width: 460px; margin: 0 auto; background: #0c111d; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }
            .accent-bar { height: 4px; background: linear-gradient(90deg, #059669 0%, #10b981 35%, #34d399 70%, #06b6d4 100%); width: 100%; }
            .content { padding: 32px 28px; text-align: center; }
            .icon-wrapper { width: 56px; height: 56px; margin: 0 auto 16px auto; background-color: rgba(52, 211, 153, 0.12); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 50%; text-align: center; line-height: 56px; box-shadow: 0 0 25px rgba(52, 211, 153, 0.25); }
            .brand-tag { font-size: 11px; font-weight: 800; color: #34d399; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
            .title { font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 8px 0; letter-spacing: -0.3px; }
            .subtitle { font-size: 14px; color: #94a3b8; line-height: 1.5; margin: 0 0 24px 0; }
            .alert-box { background: rgba(52, 211, 153, 0.06); border: 1px solid rgba(52, 211, 153, 0.15); border-radius: 10px; padding: 12px 16px; margin-top: 24px; font-size: 12px; color: #94a3b8; line-height: 1.5; }
            .footer { padding: 20px 28px; border-top: 1px solid rgba(255, 255, 255, 0.06); background-color: #090d16; font-size: 12px; color: #475569; text-align: center; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="accent-bar"></div>
              <div class="content">
                <div class="icon-wrapper">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                </div>
                <div class="brand-tag">VOXY SECURITY</div>
                <h1 class="title">Confirme seu e-mail</h1>
                <p class="subtitle">
                  Olá, <strong style="color: #ffffff;">${input.username}</strong>!<br>
                  Insira o código de 6 dígitos abaixo para ativar sua conta no Voxy:
                </p>

                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 20px auto;">
                  <tr>
                    ${digitsHtml}
                  </tr>
                </table>

                <div class="alert-box">
                  ⏱️ Este código expira em <strong style="color: #ffffff;">15 minutos</strong>.<br>
                  Se você não solicitou este cadastro, ignore esta mensagem com segurança.
                </div>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} Voxy. Todos os direitos reservados.
              </div>
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
