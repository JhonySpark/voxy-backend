import { Injectable, LoggerService } from '@nestjs/common';
import { Logtail } from '@logtail/node';

@Injectable()
export class BetterStackLoggerService implements LoggerService {
  private readonly logtail?: Logtail;
  private readonly isEnabled: boolean = false;

  constructor() {
    const token = (
      process.env.BETTER_STACK_SOURCE_TOKEN ||
      process.env.LOGTAIL_SOURCE_TOKEN ||
      ''
    ).trim();

    let endpoint = (
      process.env.BETTER_STACK_ENDPOINT ||
      process.env.BETTER_STACK_INGESTING_HOST ||
      ''
    ).trim();

    if (endpoint && !endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      endpoint = `https://${endpoint}`;
    }

    if (token) {
      this.logtail = new Logtail(token, endpoint ? { endpoint } : undefined);
      this.isEnabled = true;
      console.log(
        `[BetterStack] Telemetria ATIVADA no Backend. Destino: ${endpoint || 'https://in.logs.betterstack.com (Padrão US)'}`,
      );
    } else {
      console.warn(
        '[BetterStack] Telemetria DESATIVADA no Backend: BETTER_STACK_SOURCE_TOKEN não configurado no backend/.env (logs apenas no console local).',
      );
    }
  }

  log(message: any, context?: string, metadata?: Record<string, any>) {
    console.log(
      `[${context || 'Application'}] ${message}`,
      metadata ? JSON.stringify(metadata) : '',
    );
    if (this.isEnabled && this.logtail) {
      this.logtail.info(String(message), { context, ...metadata });
    }
  }

  error(
    message: any,
    trace?: string,
    context?: string,
    metadata?: Record<string, any>,
  ) {
    console.error(
      `[${context || 'Application'}] ERROR: ${message}`,
      trace || '',
      metadata ? JSON.stringify(metadata) : '',
    );
    if (this.isEnabled && this.logtail) {
      this.logtail.error(String(message), {
        context,
        stack: trace,
        ...metadata,
      });
    }
  }

  warn(message: any, context?: string, metadata?: Record<string, any>) {
    console.warn(
      `[${context || 'Application'}] WARN: ${message}`,
      metadata ? JSON.stringify(metadata) : '',
    );
    if (this.isEnabled && this.logtail) {
      this.logtail.warn(String(message), { context, ...metadata });
    }
  }

  debug(message: any, context?: string, metadata?: Record<string, any>) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(
        `[${context || 'Application'}] DEBUG: ${message}`,
        metadata ? JSON.stringify(metadata) : '',
      );
    }
    // Para economizar a cota gratuita de 1GB do Better Stack, não enviamos debug para a nuvem
  }

  verbose(message: any, context?: string, metadata?: Record<string, any>) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[${context || 'Application'}] VERBOSE: ${message}`,
        metadata ? JSON.stringify(metadata) : '',
      );
    }
  }

  /**
   * Log estruturado para eventos de negócio críticos (Login, Registro, LiveKit, Uploads R2, etc.)
   */
  logBusinessEvent(eventName: string, data: Record<string, any>) {
    const message = `[Event: ${eventName}]`;
    console.log(`[BusinessEvent] ${eventName}`, JSON.stringify(data));
    if (this.isEnabled && this.logtail) {
      this.logtail.info(message, {
        isBusinessEvent: true,
        eventName,
        ...data,
      });
    }
  }

  async flush(): Promise<void> {
    if (this.isEnabled && this.logtail) {
      await this.logtail.flush();
    }
  }
}
