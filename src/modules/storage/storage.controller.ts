import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { AuthGuard } from '../../auth/auth.guard.js';
import { StorageService } from './storage.service.js';
import { ChatRetentionService } from './retention.service.js';

@Controller('storage')
@UseGuards(AuthGuard)
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly retentionService: ChatRetentionService,
  ) {}

  /**
   * Upload de Avatar do Usuário (WebP 256x256, armazenado privadamente no R2)
   */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }
    const userId = req.user.sub;
    return this.storageService.uploadUserAvatar(userId, file);
  }

  /**
   * Obter URL assinada temporária para download de avatar privado
   */
  @Get('avatar/:userId/url')
  async getAvatarUrl(@Param('userId') userId: string) {
    const downloadUrl = await this.storageService.getUserAvatarDownloadUrl(userId);
    return { downloadUrl };
  }

  /**
   * Redirecionamento HTTP 302 para URL assinada do avatar (para tags <img>)
   */
  @Get('avatar/:userId')
  async getAvatarRedirect(
    @Param('userId') userId: string,
    @Res() res: any,
  ) {
    try {
      const url = await this.storageService.getUserAvatarDownloadUrl(userId);
      return res.redirect(url);
    } catch {
      return res.status(404).send('Avatar não encontrado');
    }
  }

  /**
   * Upload de Banner do Usuário (WebP 600x240, armazenado privadamente no R2)
   */
  @Post('banner')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }
    const userId = req.user.sub;
    return this.storageService.uploadUserBanner(userId, file);
  }

  /**
   * Obter URL assinada temporária para download de banner privado
   */
  @Get('banner/:userId/url')
  async getBannerUrl(@Param('userId') userId: string) {
    const downloadUrl = await this.storageService.getUserBannerDownloadUrl(userId);
    return { downloadUrl };
  }

  /**
   * Redirecionamento HTTP 302 para URL assinada do banner (para tags <img>)
   */
  @Get('banner/:userId')
  async getBannerRedirect(
    @Param('userId') userId: string,
    @Res() res: any,
  ) {
    try {
      const url = await this.storageService.getUserBannerDownloadUrl(userId);
      return res.redirect(url);
    } catch {
      return res.status(404).send('Banner não encontrado');
    }
  }

  /**
   * Upload de Ícone de Servidor (WebP 256x256, armazenado privadamente no R2)
   */
  @Post('server/:serverId/icon')
  @UseInterceptors(FileInterceptor('file'))
  async uploadServerIcon(
    @Request() req: any,
    @Param('serverId') serverId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }
    const userId = req.user.sub;
    return this.storageService.uploadServerIcon(userId, serverId, file);
  }

  /**
   * Obter URL assinada temporária para download de ícone privado de servidor
   */
  @Get('server/:serverId/icon/url')
  async getServerIconUrl(@Param('serverId') serverId: string) {
    const downloadUrl = await this.storageService.getServerIconDownloadUrl(serverId);
    return { downloadUrl };
  }

  /**
   * Redirecionamento HTTP 302 para URL assinada do ícone de servidor (para tags <img>)
   */
  @Get('server/:serverId/icon')
  async getServerIconRedirect(
    @Param('serverId') serverId: string,
    @Res() res: any,
  ) {
    try {
      const url = await this.storageService.getServerIconDownloadUrl(serverId);
      return res.redirect(url);
    } catch {
      return res.status(404).send('Ícone não encontrado');
    }
  }

  /**
   * Upload de Anexo de Chat (Imagem, Áudio Opus, Vídeo H.264 ou Documento)
   * Armazenado na zona privada com compressão agressiva
   */
  @Post('attachment')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('channelId') channelId?: string,
    @Body('receiverId') receiverId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }
    const userId = req.user.sub;
    return this.storageService.uploadAttachment(userId, file, {
      channelId,
      receiverId,
    });
  }

  /**
   * Obter Pre-signed PUT URL para upload direto do cliente ao R2 (Direct-to-R2)
   */
  @Post('presigned-upload')
  async getDirectUploadUrl(
    @Request() req: any,
    @Body()
    body: {
      fileName: string;
      fileSize: number;
      mimeType: string;
      channelId?: string;
      receiverId?: string;
      isAvatar?: boolean;
    },
  ) {
    const userId = req.user.sub;
    return this.storageService.requestDirectUploadUrl(userId, body);
  }

  /**
   * Obter URL temporária pré-assinada (15-30 min) para download seguro de anexo
   */
  @Get('attachment/:id/url')
  async getAttachmentUrl(
    @Request() req: any,
    @Param('id') attachmentId: string,
  ) {
    const userId = req.user.sub;
    return this.storageService.getAttachmentDownloadUrl(userId, attachmentId);
  }

  /**
   * Rota de disparo manual da rotina de retenção de 60 dias (para testes/manutenção)
   */
  @Post('retention/cleanup')
  async triggerRetentionCleanup() {
    return this.retentionService.handleRetentionCleanup();
  }
}
