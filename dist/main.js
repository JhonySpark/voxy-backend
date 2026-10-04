import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ quiet: true });
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedisIoAdapter } from './redis.adapter.js';
import { BetterStackLoggerService } from './infrastructure/logging/better-stack-logger.service.js';
import { BetterStackExceptionFilter } from './infrastructure/logging/better-stack-exception.filter.js';
import { HttpLoggingInterceptor } from './infrastructure/logging/http-logging.interceptor.js';
async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    const logger = app.get(BetterStackLoggerService);
    app.useLogger(logger);
    app.useGlobalFilters(app.get(BetterStackExceptionFilter));
    app.useGlobalInterceptors(app.get(HttpLoggingInterceptor));
    const config = new DocumentBuilder()
        .setTitle('Voxy API')
        .setDescription('Discord alternative API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);
    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
    app.enableCors();
    await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
//# sourceMappingURL=main.js.map