import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ChatGateway } from '../../chat/chat.gateway.js';

@Injectable()
export class CosmeticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async getUserInventory(userId: string) {
    const [user, userCosmetics] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { equippedFrameSlug: true },
      }),
      this.prisma.userCosmetic.findMany({
        where: { userId },
        include: { cosmeticItem: true },
        orderBy: { unlockedAt: 'asc' },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return {
      equippedFrameSlug: user.equippedFrameSlug,
      items: userCosmetics.map((uc) => ({
        id: uc.cosmeticItem.id,
        slug: uc.cosmeticItem.slug,
        name: uc.cosmeticItem.name,
        description: uc.cosmeticItem.description,
        type: uc.cosmeticItem.type,
        rarity: uc.cosmeticItem.rarity,
        assetUrl: uc.cosmeticItem.assetUrl,
        previewUrl: uc.cosmeticItem.previewUrl,
        metadata: uc.cosmeticItem.metadata,
        unlockedAt: uc.unlockedAt,
      })),
    };
  }

  async equipCosmetic(userId: string, cosmeticSlug: string | null) {
    if (cosmeticSlug === null || cosmeticSlug === '' || cosmeticSlug === 'none') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { equippedFrameSlug: null },
      });

      this.chatGateway.server?.emit('userProfileUpdated', {
        userId,
        equippedFrameSlug: null,
      });

      return { success: true, equippedFrameSlug: null };
    }

    // Verificar se o usuário possui o cosmético
    const userCosmetic = await this.prisma.userCosmetic.findFirst({
      where: {
        userId,
        cosmeticItem: { slug: cosmeticSlug },
      },
      include: { cosmeticItem: true },
    });

    if (!userCosmetic) {
      throw new ForbiddenException('Você não possui este cosmético em seu inventário.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { equippedFrameSlug: cosmeticSlug },
    });

    this.chatGateway.server?.emit('userProfileUpdated', {
      userId,
      equippedFrameSlug: cosmeticSlug,
    });

    return { success: true, equippedFrameSlug: cosmeticSlug };
  }
}
