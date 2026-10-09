import { Controller, Get } from '@nestjs/common';
import { SystemConfigService } from './system-config.service.js';

@Controller('config')
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get('app-status')
  async getAppStatus() {
    return this.configService.getAppStatus();
  }
}
