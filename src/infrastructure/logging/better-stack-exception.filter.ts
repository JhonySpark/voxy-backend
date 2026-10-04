import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BetterStackLoggerService } from './better-stack-logger.service.js';

@Catch()
export class BetterStackExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: BetterStackLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Se a conexão não for HTTP (ex: WebSockets / microservices), loga e retorna
    if (!response || !request || typeof response.status !== 'function') {
      const stack = (exception as Error)?.stack;
      this.logger.error(
        'Unhandled non-HTTP exception',
        stack,
        'GlobalExceptionFilter',
      );
      return;
    }

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;
    const message =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as any).message || (exception as any)?.message
        : (exception as any)?.message || 'Erro interno no servidor';

    const userId = (request as any)?.user?.sub || (request as any)?.user?.id;
    const clientIp =
      request.ip ||
      request.headers['x-forwarded-for'] ||
      request.socket?.remoteAddress;

    // Sanitiza corpo para nunca enviar senhas nem segredos ao Logtail
    const sanitizedBody = this.sanitizeData(request.body);

    const logPayload = {
      statusCode: status,
      path: request.originalUrl || request.url,
      method: request.method,
      ip: clientIp,
      userId,
      body: sanitizedBody,
      query: request.query,
    };

    if (status >= 500) {
      // Exceções não tratadas e erros 500: envia stack trace completo para o Better Stack
      const stack = (exception as Error)?.stack;
      this.logger.error(
        `HTTP ${status} Internal Error: ${request.method} ${request.url} - ${Array.isArray(message) ? message.join(', ') : message}`,
        stack,
        'ExceptionFilter',
        logPayload,
      );
    } else if (status === 401 || status === 403) {
      // Monitora falhas de autorização e segurança
      this.logger.warn(
        `Security Alert (${status}): ${request.method} ${request.url} - ${Array.isArray(message) ? message.join(', ') : message}`,
        'SecurityFilter',
        logPayload,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const clone = { ...data };
    const sensitiveKeys = [
      'password',
      'senha',
      'token',
      'authorization',
      'secret',
      'secretkey',
      'access_token',
      'refreshtoken',
    ];

    for (const key of Object.keys(clone)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        clone[key] = '***REDACTED***';
      } else if (typeof clone[key] === 'object') {
        clone[key] = this.sanitizeData(clone[key]);
      }
    }
    return clone;
  }
}
