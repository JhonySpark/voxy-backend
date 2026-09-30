import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatRetentionService } from './retention.service.js';

describe('ChatRetentionService', () => {
  let service: ChatRetentionService;
  let mockPrisma: any;
  let mockStoragePort: any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CHAT_RETENTION_DAYS = '60';

    mockPrisma = {
      attachment: {
        findMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      channelMessage: {
        deleteMany: vi.fn(),
      },
      message: {
        deleteMany: vi.fn(),
      },
    };

    mockStoragePort = {
      deleteFiles: vi.fn().mockResolvedValue(undefined),
    };

    service = new ChatRetentionService(mockPrisma, mockStoragePort);
  });

  it('should find expired attachments, delete them from R2 and purge messages', async () => {
    mockPrisma.attachment.findMany.mockResolvedValueOnce([
      { id: 'att-1', fileKey: 'private/channels/file1.png' },
      { id: 'att-2', fileKey: 'private/channels/file2.ogg' },
    ]);
    mockPrisma.channelMessage.deleteMany.mockResolvedValueOnce({ count: 15 });
    mockPrisma.message.deleteMany.mockResolvedValueOnce({ count: 5 });
    mockPrisma.attachment.deleteMany.mockResolvedValueOnce({ count: 2 });

    const result = await service.handleRetentionCleanup();

    expect(mockPrisma.attachment.findMany).toHaveBeenCalled();
    expect(mockStoragePort.deleteFiles).toHaveBeenCalledWith([
      'private/channels/file1.png',
      'private/channels/file2.ogg',
    ]);
    expect(mockPrisma.channelMessage.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.message.deleteMany).toHaveBeenCalled();
    expect(result).toEqual({
      deletedFiles: 2,
      deletedDirectMessages: 5,
      deletedChannelMessages: 15,
    });
  });

  it('should skip retention when CHAT_RETENTION_DAYS is 0', async () => {
    process.env.CHAT_RETENTION_DAYS = '0';

    const result = await service.handleRetentionCleanup();

    expect(mockPrisma.attachment.findMany).not.toHaveBeenCalled();
    expect(mockStoragePort.deleteFiles).not.toHaveBeenCalled();
    expect(result).toEqual({
      deletedFiles: 0,
      deletedDirectMessages: 0,
      deletedChannelMessages: 0,
    });
  });
});
