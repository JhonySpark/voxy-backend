import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import 'multer';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { STORAGE_PORT } from '../../core/ports/storage.port.js';
import type { IStoragePort } from '../../core/ports/storage.port.js';
import { MediaCompressionService } from '../../infrastructure/media/media-compression.service.js';

export interface UploadAttachmentContext {
  channelId?: string;
  receiverId?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PORT) private readonly storagePort: IStoragePort,
    private readonly mediaCompression: MediaCompressionService,
  ) {}

  /**
   * Upload e compressão de Avatar do Usuário (Zona Privada)
   */
  async uploadUserAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string; avatarKey: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Arquivo não enviado.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // 1. Processar e comprimir imagem com Sharp (WebP 256x256, sem EXIF)
    const processed = await this.mediaCompression.processAvatar(file.buffer);

    // 2. Apagar avatar antigo do R2 se existir
    if (user.avatarKey) {
      try {
        await this.storagePort.deleteFile(user.avatarKey);
      } catch (err) {
        this.logger.warn(`Não foi possível remover avatar anterior do R2: ${String(err)}`);
      }
    }

    // 3. Subir para pasta privada do R2 (100% privado)
    const key = `private/avatars/${userId}/avatar_${Date.now()}.webp`;
    await this.storagePort.uploadFile({
      key,
      buffer: processed.buffer,
      contentType: processed.mimeType,
      isPublic: false,
    });

    const avatarUrl = `/storage/avatar/${userId}`;

    // 4. Atualizar registro do usuário
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl,
        avatarKey: key,
      },
    });

    return {
      avatarUrl,
      avatarKey: key,
    };
  }

  /**
   * Upload e compressão de Ícone de Servidor (Zona Privada)
   */
  async uploadServerIcon(
    userId: string,
    serverId: string,
    file: Express.Multer.File,
  ): Promise<{ iconUrl: string; iconKey: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Arquivo não enviado.');
    }

    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      include: { members: true },
    });

    if (!server) {
      throw new NotFoundException('Servidor não encontrado.');
    }

    // Apenas dono ou admin do servidor pode alterar o ícone
    const isOwner = server.ownerId === userId;
    const isServerAdmin = server.members.some(
      (m) => m.userId === userId && (m.role === 'OWNER' || m.role === 'ADMIN'),
    );

    if (!isOwner && !isServerAdmin) {
      throw new ForbiddenException('Você não tem permissão para alterar o ícone deste servidor.');
    }

    const processed = await this.mediaCompression.processAvatar(file.buffer);

    if (server.iconKey) {
      try {
        await this.storagePort.deleteFile(server.iconKey);
      } catch (err) {
        this.logger.warn(`Não foi possível remover ícone anterior do servidor: ${String(err)}`);
      }
    }

    const key = `private/servers/${serverId}/icon_${Date.now()}.webp`;
    await this.storagePort.uploadFile({
      key,
      buffer: processed.buffer,
      contentType: processed.mimeType,
      isPublic: false,
    });

    const iconUrl = `/storage/server/${serverId}/icon`;

    await this.prisma.server.update({
      where: { id: serverId },
      data: {
        iconUrl,
        iconKey: key,
      },
    });

    return {
      iconUrl,
      iconKey: key,
    };
  }

  /**
   * Upload de Anexo para Canais ou Mensagens Diretas (Zona Privada)
   */
  async uploadAttachment(
    userId: string,
    file: Express.Multer.File,
    context: UploadAttachmentContext,
  ): Promise<{
    attachmentId: string;
    fileKey: string;
    fileName: string;
    fileType: string;
    mimeType: string;
    fileSize: number;
    originalSize: number;
    downloadUrl: string;
  }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Arquivo não enviado.');
    }

    if (!context.channelId && !context.receiverId) {
      throw new BadRequestException('É necessário informar o canal (channelId) ou destinatário (receiverId).');
    }

    let r2Prefix = '';
    const now = new Date();
    const yearMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

    // 1. Validar permissões de acesso
    if (context.channelId) {
      const channel = await this.prisma.channel.findUnique({
        where: { id: context.channelId },
        include: {
          server: {
            include: { members: true },
          },
        },
      });

      if (!channel) {
        throw new NotFoundException('Canal não encontrado.');
      }

      const isMember = channel.server.members.some((m) => m.userId === userId);
      if (!isMember) {
        throw new ForbiddenException('Você não é membro do servidor deste canal.');
      }

      r2Prefix = `private/channels/${channel.serverId}/${channel.id}/${yearMonth}`;
    } else if (context.receiverId) {
      if (context.receiverId === userId) {
        throw new BadRequestException('Não é permitido enviar anexo para si mesmo.');
      }

      const receiver = await this.prisma.user.findUnique({
        where: { id: context.receiverId },
      });

      if (!receiver) {
        throw new NotFoundException('Destinatário não encontrado.');
      }

      // Identificador consistente e único para a conversa direta
      const convHash = [userId, context.receiverId].sort().join('_');
      r2Prefix = `private/direct/${convHash}/${yearMonth}`;
    }

    // 2. Processar e comprimir arquivo com base na categoria
    const { processed, category, safeName } = await this.mediaCompression.processAttachment(
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    const fileId = randomUUID();
    const finalKey = `${r2Prefix}/${fileId}_${safeName}`;

    // 3. Upload seguro para o R2 na zona privada
    await this.storagePort.uploadFile({
      key: finalKey,
      buffer: processed.buffer,
      contentType: processed.mimeType,
      isPublic: false,
    });

    // 4. Salvar registro do anexo no banco de dados
    const attachment = await this.prisma.attachment.create({
      data: {
        id: fileId,
        fileName: file.originalname,
        fileKey: finalKey,
        fileType: category,
        mimeType: processed.mimeType,
        fileSize: processed.compressedSize,
        originalSize: processed.originalSize,
      },
    });

    // 5. Gerar URL temporária pré-assinada para visualização imediata
    const downloadUrl = await this.storagePort.getPresignedDownloadUrl(finalKey, 14400);

    return {
      attachmentId: attachment.id,
      fileKey: attachment.fileKey,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
      originalSize: attachment.originalSize,
      downloadUrl,
    };
  }

  /**
   * Obtém URL assinada temporária para visualização de anexo privado
   */
  async getAttachmentDownloadUrl(
    userId: string,
    attachmentId: string,
  ): Promise<{ downloadUrl: string; thumbnailUrl?: string }> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        message: true,
        channelMessage: {
          include: {
            channel: {
              include: {
                server: {
                  include: { members: true },
                },
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Anexo não encontrado.');
    }

    // Verificação de permissões contra vazamento de dados
    if (attachment.channelMessage) {
      const isMember = attachment.channelMessage.channel.server.members.some(
        (m) => m.userId === userId,
      );
      if (!isMember) {
        throw new ForbiddenException('Acesso negado a este anexo.');
      }
    } else if (attachment.message) {
      const isParticipant =
        attachment.message.senderId === userId || attachment.message.receiverId === userId;
      if (!isParticipant) {
        throw new ForbiddenException('Acesso negado a esta conversa.');
      }
    }

    const downloadUrl = await this.storagePort.getPresignedDownloadUrl(attachment.fileKey, 14400);
    const thumbnailUrl = attachment.thumbnailKey
      ? await this.storagePort.getPresignedDownloadUrl(attachment.thumbnailKey, 14400)
      : undefined;

    return { downloadUrl, thumbnailUrl };
  }

  /**
   * Emite uma Pre-signed PUT URL para upload direto do cliente ao Cloudflare R2
   * (Zero consumo de CPU e largura de banda no backend)
   */
  async requestDirectUploadUrl(
    userId: string,
    dto: {
      fileName: string;
      fileSize: number;
      mimeType: string;
      channelId?: string;
      receiverId?: string;
      isAvatar?: boolean;
      hasThumbnail?: boolean;
    },
  ): Promise<{
    uploadUrl: string;
    thumbnailUploadUrl?: string;
    attachmentId?: string;
    fileKey: string;
    thumbnailKey?: string;
    fileType: string;
  }> {
    if (!dto.fileName || !dto.mimeType || !dto.fileSize) {
      throw new BadRequestException('fileName, mimeType e fileSize são obrigatórios.');
    }

    if (dto.isAvatar) {
      this.mediaCompression.validateLimits(dto.fileSize, 'AVATAR');
      const key = `private/avatars/${userId}/avatar_${Date.now()}.webp`;
      const uploadUrl = await this.storagePort.getPresignedUploadUrl(key, 'image/webp', 900);
      return {
        uploadUrl,
        fileKey: key,
        fileType: 'IMAGE',
      };
    }

    if (!dto.channelId && !dto.receiverId) {
      throw new BadRequestException('Informe channelId ou receiverId para anexos de chat.');
    }

    const category = this.mediaCompression.classifyFile(dto.mimeType, dto.fileName);
    this.mediaCompression.validateLimits(dto.fileSize, category);

    let r2Prefix = '';
    const now = new Date();
    const yearMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

    if (dto.channelId) {
      const channel = await this.prisma.channel.findUnique({
        where: { id: dto.channelId },
        include: {
          server: {
            include: { members: true },
          },
        },
      });

      if (!channel) {
        throw new NotFoundException('Canal não encontrado.');
      }

      const isMember = channel.server.members.some((m) => m.userId === userId);
      if (!isMember) {
        throw new ForbiddenException('Você não é membro do servidor deste canal.');
      }

      r2Prefix = `private/channels/${channel.serverId}/${channel.id}/${yearMonth}`;
    } else if (dto.receiverId) {
      if (dto.receiverId === userId) {
        throw new BadRequestException('Não é permitido enviar anexo para si mesmo.');
      }

      const receiver = await this.prisma.user.findUnique({
        where: { id: dto.receiverId },
      });

      if (!receiver) {
        throw new NotFoundException('Destinatário não encontrado.');
      }

      const convHash = [userId, dto.receiverId].sort().join('_');
      r2Prefix = `private/direct/${convHash}/${yearMonth}`;
    }

    const fileId = randomUUID();
    const safeName = this.mediaCompression.sanitizeFilename(dto.fileName);
    const finalKey = `${r2Prefix}/${fileId}_${safeName}`;

    let thumbnailKey: string | undefined;
    let thumbnailUploadUrl: string | undefined;

    // Se o cliente enviar thumbnail gerada localmente (imagens ou capa de vídeo)
    if (dto.hasThumbnail && (category === 'IMAGE' || category === 'VIDEO')) {
      thumbnailKey = `${r2Prefix}/${fileId}_${safeName}_thumb.webp`;
      thumbnailUploadUrl = await this.storagePort.getPresignedUploadUrl(
        thumbnailKey,
        'image/webp',
        900,
      );
    }

    // Pré-registra o anexo no banco de dados com a chave da miniatura
    const attachment = await this.prisma.attachment.create({
      data: {
        id: fileId,
        fileName: dto.fileName,
        fileKey: finalKey,
        thumbnailKey,
        fileType: category,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        originalSize: dto.fileSize,
      },
    });

    const uploadUrl = await this.storagePort.getPresignedUploadUrl(finalKey, dto.mimeType, 900);

    return {
      uploadUrl,
      thumbnailUploadUrl,
      attachmentId: attachment.id,
      fileKey: finalKey,
      thumbnailKey,
      fileType: category,
    };
  }

  /**
   * Upload e compressão de Banner do Usuário (Zona Privada)
   */
  async uploadUserBanner(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ bannerUrl: string; bannerKey: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Arquivo não enviado.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const processed = await this.mediaCompression.processBanner(file.buffer);

    if (user.bannerKey) {
      try {
        await this.storagePort.deleteFile(user.bannerKey);
      } catch (err) {
        this.logger.warn(`Não foi possível remover banner anterior do R2: ${String(err)}`);
      }
    }

    const key = `private/banners/${userId}/banner_${Date.now()}.webp`;
    await this.storagePort.uploadFile({
      key,
      buffer: processed.buffer,
      contentType: processed.mimeType,
      isPublic: false,
    });

    const bannerUrl = `/storage/banner/${userId}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        bannerUrl,
        bannerKey: key,
      },
    });

    return {
      bannerUrl,
      bannerKey: key,
    };
  }

  /**
   * Obtém URL assinada temporária para download de banner privado de usuário
   */
  async getUserBannerDownloadUrl(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { bannerKey: true },
    });

    if (!user || !user.bannerKey) {
      throw new NotFoundException('Banner não encontrado para este usuário.');
    }

    return this.storagePort.getPresignedDownloadUrl(user.bannerKey, 14400);
  }

  /**
   * Obtém URL assinada temporária para download de avatar privado de usuário
   */
  async getUserAvatarDownloadUrl(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true },
    });

    if (!user || !user.avatarKey) {
      throw new NotFoundException('Avatar não encontrado para este usuário.');
    }

    return this.storagePort.getPresignedDownloadUrl(user.avatarKey, 14400);
  }

  /**
   * Obtém URL assinada temporária para download de ícone privado de servidor
   */
  async getServerIconDownloadUrl(serverId: string): Promise<string> {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      select: { iconKey: true },
    });

    if (!server || !server.iconKey) {
      throw new NotFoundException('Ícone não encontrado para este servidor.');
    }

    return this.storagePort.getPresignedDownloadUrl(server.iconKey, 14400);
  }
}


