import { Injectable } from '@nestjs/common';
import { IPasswordHasherPort } from '../../../core/ports/security/password-hasher.port.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptPasswordHasherAdapter implements IPasswordHasherPort {
  private readonly saltRounds = 10;

  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.saltRounds);
  }

  async compare(plainText: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }
}
