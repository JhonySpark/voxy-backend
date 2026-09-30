import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';

export interface ProcessedMedia {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  originalSize: number;
  compressedSize: number;
}

export type FileCategory = 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';

@Injectable()
export class MediaCompressionService {
  private readonly logger = new Logger(MediaCompressionService.name);

  // Limites padrão (em bytes) caso não definidos em process.env
  private readonly MAX_AVATAR_SIZE = Number(process.env.MAX_AVATAR_SIZE) || 2 * 1024 * 1024; // 2MB
  private readonly MAX_IMAGE_SIZE = Number(process.env.MAX_IMAGE_SIZE) || 10 * 1024 * 1024; // 10MB
  private readonly MAX_AUDIO_SIZE = Number(process.env.MAX_AUDIO_SIZE) || 15 * 1024 * 1024; // 15MB
  private readonly MAX_VIDEO_SIZE = Number(process.env.MAX_VIDEO_SIZE) || 50 * 1024 * 1024; // 50MB
  private readonly MAX_DOC_SIZE = Number(process.env.MAX_DOC_SIZE) || 20 * 1024 * 1024; // 20MB

  // Extensões proibidas por segurança
  private readonly BLOCKED_EXTENSIONS = new Set([
    '.exe',
    '.bat',
    '.cmd',
    '.sh',
    '.vbs',
    '.js',
    '.mjs',
    '.htm',
    '.html',
    '.php',
    '.jar',
    '.com',
    '.scr',
    '.msi',
  ]);

  constructor() {
    if (ffmpegStatic) {
      ffmpeg.setFfmpegPath(ffmpegStatic as unknown as string);
    } else {
      this.logger.warn('ffmpeg-static binary path não encontrado. FFmpeg dependerá do PATH do sistema.');
    }
  }

  /**
   * Classifica a categoria do arquivo a partir de seu MIME type e extensão
   */
  classifyFile(mimeType: string, filename: string): FileCategory {
    const ext = path.extname(filename).toLowerCase();

    if (this.BLOCKED_EXTENSIONS.has(ext)) {
      throw new BadRequestException(`Tipo de arquivo não permitido por segurança: ${ext}`);
    }

    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    if (mimeType.startsWith('video/')) return 'VIDEO';

    return 'DOCUMENT';
  }

  /**
   * Valida limites de tamanho antes da compressão
   */
  validateLimits(size: number, category: FileCategory | 'AVATAR'): void {
    let limit = this.MAX_DOC_SIZE;

    if (category === 'AVATAR') limit = this.MAX_AVATAR_SIZE;
    else if (category === 'IMAGE') limit = this.MAX_IMAGE_SIZE;
    else if (category === 'AUDIO') limit = this.MAX_AUDIO_SIZE;
    else if (category === 'VIDEO') limit = this.MAX_VIDEO_SIZE;

    if (size > limit) {
      const mbLimit = Math.round(limit / (1024 * 1024));
      throw new BadRequestException(
        `Arquivo excede o limite máximo permitido de ${mbLimit}MB para ${category.toLowerCase()}.`,
      );
    }
  }

  /**
   * Sanitiza nomes de arquivos para prevenir path traversal e caracteres perigosos
   */
  sanitizeFilename(originalName: string): string {
    const parsed = path.parse(originalName);
    const safeBase = parsed.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_').slice(0, 50);
    return `${safeBase || 'file'}${parsed.ext.toLowerCase()}`;
  }

  /**
   * Comprime imagem de avatar (256x256 WebP, 80% qualidade, strip EXIF)
   */
  async processAvatar(inputBuffer: Buffer): Promise<ProcessedMedia> {
    this.validateLimits(inputBuffer.length, 'AVATAR');

    const compressed = await sharp(inputBuffer)
      .resize(256, 256, { fit: 'cover', position: 'center' })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();

    return {
      buffer: compressed,
      mimeType: 'image/webp',
      extension: '.webp',
      originalSize: inputBuffer.length,
      compressedSize: compressed.length,
    };
  }

  /**
   * Comprime imagem enviada no chat (máx 1920x1080 WebP, 75% qualidade, strip EXIF)
   */
  async processChatImage(inputBuffer: Buffer): Promise<ProcessedMedia> {
    this.validateLimits(inputBuffer.length, 'IMAGE');

    const compressed = await sharp(inputBuffer)
      .resize({
        width: 1920,
        height: 1080,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 75, effort: 4 })
      .toBuffer();

    return {
      buffer: compressed,
      mimeType: 'image/webp',
      extension: '.webp',
      originalSize: inputBuffer.length,
      compressedSize: compressed.length,
    };
  }

  /**
   * Comprime áudio no estilo WhatsApp (Opus mono @ 32-48kbps em container Ogg)
   */
  async processAudio(inputBuffer: Buffer, originalExt: string): Promise<ProcessedMedia> {
    this.validateLimits(inputBuffer.length, 'AUDIO');

    const tempId = randomUUID();
    const tempIn = path.join(os.tmpdir(), `voxy_in_${tempId}${originalExt}`);
    const tempOut = path.join(os.tmpdir(), `voxy_out_${tempId}.ogg`);

    try {
      await fs.writeFile(tempIn, inputBuffer);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempIn)
          .audioCodec('libopus')
          .audioBitrate('36k')
          .audioChannels(1)
          .audioFrequency(48000)
          .format('ogg')
          .output(tempOut)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });

      const compressed = await fs.readFile(tempOut);

      return {
        buffer: compressed,
        mimeType: 'audio/ogg',
        extension: '.ogg',
        originalSize: inputBuffer.length,
        compressedSize: compressed.length,
      };
    } catch (error) {
      this.logger.warn(`Falha na compressão FFmpeg de áudio: ${String(error)}. Retornando buffer original.`);
      return {
        buffer: inputBuffer,
        mimeType: 'audio/mpeg',
        extension: originalExt,
        originalSize: inputBuffer.length,
        compressedSize: inputBuffer.length,
      };
    } finally {
      await fs.unlink(tempIn).catch(() => null);
      await fs.unlink(tempOut).catch(() => null);
    }
  }

  /**
   * Comprime vídeo no estilo WhatsApp (H.264 720p, CRF 28, AAC 64k mono, faststart)
   */
  async processVideo(inputBuffer: Buffer, originalExt: string): Promise<ProcessedMedia> {
    this.validateLimits(inputBuffer.length, 'VIDEO');

    const tempId = randomUUID();
    const tempIn = path.join(os.tmpdir(), `voxy_vin_${tempId}${originalExt}`);
    const tempOut = path.join(os.tmpdir(), `voxy_vout_${tempId}.mp4`);

    try {
      await fs.writeFile(tempIn, inputBuffer);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempIn)
          .videoCodec('libx264')
          .videoFilters([
            "scale='min(1280,iw)':-2", // Reduz para no máximo 720p mantendo aspecto
          ])
          .outputOptions([
            '-preset faster',
            '-crf 28',
            '-movflags +faststart', // Permite streaming e início imediato
          ])
          .audioCodec('aac')
          .audioBitrate('64k')
          .audioChannels(1)
          .format('mp4')
          .output(tempOut)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });

      const compressed = await fs.readFile(tempOut);

      return {
        buffer: compressed,
        mimeType: 'video/mp4',
        extension: '.mp4',
        originalSize: inputBuffer.length,
        compressedSize: compressed.length,
      };
    } catch (error) {
      this.logger.warn(`Falha na compressão FFmpeg de vídeo: ${String(error)}. Retornando buffer original.`);
      return {
        buffer: inputBuffer,
        mimeType: 'video/mp4',
        extension: originalExt,
        originalSize: inputBuffer.length,
        compressedSize: inputBuffer.length,
      };
    } finally {
      await fs.unlink(tempIn).catch(() => null);
      await fs.unlink(tempOut).catch(() => null);
    }
  }

  /**
   * Roteia o arquivo para a compressão correta conforme sua categoria
   */
  async processAttachment(
    fileBuffer: Buffer,
    mimeType: string,
    filename: string,
  ): Promise<{ processed: ProcessedMedia; category: FileCategory; safeName: string }> {
    const category = this.classifyFile(mimeType, filename);
    const safeName = this.sanitizeFilename(filename);
    const ext = path.extname(filename).toLowerCase();

    let processed: ProcessedMedia;

    switch (category) {
      case 'IMAGE':
        processed = await this.processChatImage(fileBuffer);
        break;
      case 'AUDIO':
        processed = await this.processAudio(fileBuffer, ext);
        break;
      case 'VIDEO':
        processed = await this.processVideo(fileBuffer, ext);
        break;
      case 'DOCUMENT':
      default:
        this.validateLimits(fileBuffer.length, 'DOCUMENT');
        processed = {
          buffer: fileBuffer,
          mimeType,
          extension: ext,
          originalSize: fileBuffer.length,
          compressedSize: fileBuffer.length,
        };
        break;
    }

    return { processed, category, safeName };
  }
}
