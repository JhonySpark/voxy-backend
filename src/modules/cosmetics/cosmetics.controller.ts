import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CosmeticsService } from './cosmetics.service.js';
import { AuthGuard } from '../../auth/auth.guard.js';

@Controller('cosmetics')
@UseGuards(AuthGuard)
export class CosmeticsController {
  constructor(private readonly cosmeticsService: CosmeticsService) {}

  @Get('inventory')
  async getInventory(@Request() req: any) {
    return this.cosmeticsService.getUserInventory(req.user.sub);
  }

  @Post('equip')
  async equipCosmetic(
    @Request() req: any,
    @Body() body: { cosmeticSlug: string | null },
  ) {
    return this.cosmeticsService.equipCosmetic(req.user.sub, body.cosmeticSlug ?? null);
  }
}
