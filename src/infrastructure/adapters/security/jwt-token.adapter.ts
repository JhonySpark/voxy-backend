import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenServicePort } from '../../../core/ports/security/token-service.port.js';

@Injectable()
export class JwtTokenServiceAdapter implements ITokenServicePort {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: Record<string, any>): string {
    return this.jwtService.sign(payload);
  }

  async verifyAsync<T extends object = any>(token: string): Promise<T> {
    return this.jwtService.verifyAsync<T>(token, {
      secret: process.env.JWT_SECRET || 'secretKey',
    });
  }
}
