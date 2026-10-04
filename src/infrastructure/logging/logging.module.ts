import { Global, Module } from '@nestjs/common';
import { BetterStackLoggerService } from './better-stack-logger.service.js';
import { BetterStackExceptionFilter } from './better-stack-exception.filter.js';
import { HttpLoggingInterceptor } from './http-logging.interceptor.js';

@Global()
@Module({
  providers: [
    BetterStackLoggerService,
    BetterStackExceptionFilter,
    HttpLoggingInterceptor,
  ],
  exports: [
    BetterStackLoggerService,
    BetterStackExceptionFilter,
    HttpLoggingInterceptor,
  ],
})
export class LoggingModule {}
