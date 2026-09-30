import { describe, it, expect, vi, beforeEach } from 'vitest';
import { R2StorageAdapter } from './r2-storage.adapter.js';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: class {
      send = mockSend;
    },
    PutObjectCommand: class {
      constructor(public input: any) {}
    },
    GetObjectCommand: class {
      constructor(public input: any) {}
    },
    DeleteObjectCommand: class {
      constructor(public input: any) {}
    },
    DeleteObjectsCommand: class {
      constructor(public input: any) {}
    },
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => {
  return {
    getSignedUrl: vi.fn().mockResolvedValue('https://signed-url.example.com/file'),
  };
});

describe('R2StorageAdapter', () => {
  let adapter: R2StorageAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.R2_ACCOUNT_ID = 'test-account';
    process.env.R2_ACCESS_KEY_ID = 'test-key';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret';
    process.env.R2_BUCKET_NAME = 'test-bucket';
    process.env.R2_PUBLIC_URL = 'https://cdn.example.com';

    adapter = new R2StorageAdapter();
  });

  it('should upload a public file and return public cdn url', async () => {
    mockSend.mockResolvedValueOnce({});

    const result = await adapter.uploadFile({
      key: 'public/avatars/user-1/avatar.webp',
      buffer: Buffer.from('fake-image'),
      contentType: 'image/webp',
      isPublic: true,
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(result.key).toBe('public/avatars/user-1/avatar.webp');
    expect(result.url).toBe('https://cdn.example.com/public/avatars/user-1/avatar.webp');
  });

  it('should upload a private file and return empty direct url', async () => {
    mockSend.mockResolvedValueOnce({});

    const result = await adapter.uploadFile({
      key: 'private/channels/server-1/channel-1/file.ogg',
      buffer: Buffer.from('fake-audio'),
      contentType: 'audio/ogg',
      isPublic: false,
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(result.key).toBe('private/channels/server-1/channel-1/file.ogg');
    expect(result.url).toBe('');
  });

  it('should generate presigned url for downloading private files', async () => {
    const url = await adapter.getPresignedDownloadUrl('private/file.png', 1800);
    expect(url).toBe('https://signed-url.example.com/file');
  });

  it('should generate presigned url for uploading files', async () => {
    const url = await adapter.getPresignedUploadUrl('private/file.webp', 'image/webp', 900);
    expect(url).toBe('https://signed-url.example.com/file');
  });

  it('should delete a file', async () => {
    mockSend.mockResolvedValueOnce({});
    await adapter.deleteFile('private/test.png');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('should batch delete multiple files', async () => {
    mockSend.mockResolvedValueOnce({});
    await adapter.deleteFiles(['file1.png', 'file2.png']);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
