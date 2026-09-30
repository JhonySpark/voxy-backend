export interface UploadFileOptions {
  key: string;
  buffer: Buffer;
  contentType: string;
  isPublic?: boolean;
}

export interface UploadFileResult {
  key: string;
  url: string;
}

export interface IStoragePort {
  uploadFile(options: UploadFileOptions): Promise<UploadFileResult>;
  getPresignedUploadUrl(key: string, contentType: string, expiresInSeconds?: number): Promise<string>;
  getPresignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  deleteFile(key: string): Promise<void>;
  deleteFiles(keys: string[]): Promise<void>;
  getPublicUrl(key: string): string;
}

export const STORAGE_PORT = Symbol('STORAGE_PORT');
