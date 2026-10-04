import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { PrismaService } from '../../prisma/prisma.service.js';

let appVersion = process.env.npm_package_version || '';
if (!appVersion) {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'),
    );
    appVersion = pkg.version || '0.0.0';
  } catch {
    appVersion = '0.0.0';
  }
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary:
      'Verifica a saúde da API e do banco de dados para monitoramento do Better Stack Uptime',
  })
  async checkHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
        version: appVersion,
      };
    } catch (err: any) {
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: err?.message || 'Database connection error',
      });
    }
  }
}
