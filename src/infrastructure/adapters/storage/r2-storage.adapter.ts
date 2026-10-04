import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  IStoragePort,
  UploadFileOptions,
  UploadFileResult,
} from '../../../core/ports/storage.port.js';

@Injectable()
export class R2StorageAdapter implements IStoragePort {
  private readonly logger = new Logger(R2StorageAdapter.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicBaseUrl: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
    const endpoint =
      process.env.R2_ENDPOINT ||
      (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

    this.bucketName = process.env.R2_BUCKET_NAME || 'voxy-storage';
    this.publicBaseUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') || '';

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'Credenciais do Cloudflare R2 (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) não estão configuradas. Operações de storage falharão se invocadas.',
      );
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
    const cacheControl = options.isPublic
      ? 'public, max-age=31536000, immutable'
      : 'private, max-age=14400';

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: options.key,
      Body: options.buffer,
      ContentType: options.contentType,
      CacheControl: cacheControl,
    });

    await this.s3Client.send(command);

    const url = options.isPublic ? this.getPublicUrl(options.key) : '';

    return {
      key: options.key,
      url,
    };
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds = 900,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  async getPresignedDownloadUrl(key: string, expiresInSeconds = 86400): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ResponseCacheControl: 'private, max-age=86400',
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async deleteFiles(keys: string[]): Promise<void> {
    if (!keys || keys.length === 0) return;

    // S3 DeleteObjects aceita até 1000 chaves por requisição
    const batchSize = 1000;
    for (let i = 0; i < keys.length; i += batchSize) {
      const chunk = keys.slice(i, i + batchSize).map((Key) => ({ Key }));

      const command = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: chunk,
          Quiet: true,
        },
      });

      await this.s3Client.send(command);
    }
  }

  getPublicUrl(key: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${key}`;
    }
    const accountId = process.env.R2_ACCOUNT_ID;
    if (accountId) {
      return `https://${accountId}.r2.cloudflarestorage.com/${this.bucketName}/${key}`;
    }
    return `/${this.bucketName}/${key}`;
  }
}
