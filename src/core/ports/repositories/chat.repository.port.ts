export interface IChatRepository {
  saveDirectMessage(senderId: string, receiverId: string, content: string): Promise<any>;
  getDirectMessages(userId1: string, userId2: string): Promise<any[]>;
}

export const CHAT_REPOSITORY = Symbol('CHAT_REPOSITORY');
