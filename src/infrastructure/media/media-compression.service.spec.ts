import { describe, it, expect, beforeEach } from 'vitest';
import { MediaCompressionService } from './media-compression.service.js';
import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

describe('MediaCompressionService', () => {
  let service: MediaCompressionService;

  beforeEach(() => {
    service = new MediaCompressionService();
  });

  describe('classifyFile', () => {
    it('should classify image, audio, video and documents correctly', () => {
      expect(service.classifyFile('image/png', 'photo.png')).toBe('IMAGE');
      expect(service.classifyFile('audio/mpeg', 'audio.mp3')).toBe('AUDIO');
      expect(service.classifyFile('video/mp4', 'clip.mp4')).toBe('VIDEO');
      expect(service.classifyFile('application/pdf', 'report.pdf')).toBe('DOCUMENT');
    });

    it('should reject dangerous executable extensions', () => {
      expect(() => service.classifyFile('application/x-msdownload', 'virus.exe')).toThrow(
        BadRequestException,
      );
      expect(() => service.classifyFile('text/plain', 'script.bat')).toThrow(BadRequestException);
      expect(() => service.classifyFile('application/javascript', 'evil.js')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize filename removing path traversal and special characters', () => {
      const sanitized = service.sanitizeFilename('../../../etc/passwd!@#.png');
      expect(sanitized).not.toContain('..');
      expect(sanitized).toMatch(/^[a-zA-Z0-9_\-\.]+\.png$/);
    });
  });

  describe('validateLimits', () => {
    it('should throw if file exceeds size limit', () => {
      const hugeAvatarSize = 5 * 1024 * 1024; // 5MB > 2MB limit
      expect(() => service.validateLimits(hugeAvatarSize, 'AVATAR')).toThrow(BadRequestException);
    });

    it('should allow files within limits', () => {
      const normalSize = 1024 * 100; // 100KB
      expect(() => service.validateLimits(normalSize, 'AVATAR')).not.toThrow();
    });
  });

  describe('processAvatar', () => {
    it('should convert raw image buffer to WebP 256x256', async () => {
      // Cria uma imagem simples 100x100 em memória usando sharp
      const testImageBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      const result = await service.processAvatar(testImageBuffer);

      expect(result.mimeType).toBe('image/webp');
      expect(result.extension).toBe('.webp');
      expect(result.buffer).toBeInstanceOf(Buffer);

      const metadata = await sharp(result.buffer).metadata();
      expect(metadata.width).toBe(256);
      expect(metadata.height).toBe(256);
      expect(metadata.format).toBe('webp');
    });
  });
});
