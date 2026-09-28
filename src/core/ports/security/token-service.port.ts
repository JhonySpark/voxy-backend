export interface ITokenServicePort {
  sign(payload: Record<string, any>): string;
  verifyAsync<T extends object = any>(token: string): Promise<T>;
}

export const TOKEN_SERVICE_PORT = Symbol('TOKEN_SERVICE_PORT');
