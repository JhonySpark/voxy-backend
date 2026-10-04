import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { BetterStackLoggerService } from './better-stack-logger.service.js';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: BetterStackLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const path = req.originalUrl || req.url;

    // Ignora endpoints de /health e swagger do log HTTP comum para não estourar a cota gratuita de 1GB
    if (path.startsWith('/health') || path.startsWith('/api') && (path.includes('swagger') || path.endsWith('.json'))) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startTime;
          const statusCode = res.statusCode;
          const userId = (req as any)?.user?.sub || (req as any)?.user?.id;

          // Em produção, registra operações com mutação (POST/PUT/DELETE/PATCH), erros ou rotas lentas (> 500ms)
          if (req.method !== 'GET' || durationMs > 500 || statusCode >= 400) {
            this.logger.log(
              `${req.method} ${path} ${statusCode} - ${durationMs}ms`,
              'HTTP',
              {
                method: req.method,
                path,
                statusCode,
                durationMs,
                userId,
                ip: req.ip || req.headers['x-forwarded-for'],
              },
            );
          }
        },
      }),
    );
  }
}
