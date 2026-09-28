import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { PASSWORD_HASHER_PORT } from '../core/ports/security/password-hasher.port.js';
import type { IPasswordHasherPort } from '../core/ports/security/password-hasher.port.js';
import { TOKEN_SERVICE_PORT } from '../core/ports/security/token-service.port.js';
import type { ITokenServicePort } from '../core/ports/security/token-service.port.js';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    @Inject(TOKEN_SERVICE_PORT) private tokenService: ITokenServicePort,
    @Inject(PASSWORD_HASHER_PORT) private passwordHasher: IPasswordHasherPort,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await this.passwordHasher.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.tokenService.sign(payload),
    };
  }

  async register(data: { email: string; username: string; password?: string }) {
    const userExists = await this.usersService.findByEmail(data.email);
    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await this.passwordHasher.hash(data.password || '');
    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
    });

    const { password, ...result } = user;
    return result;
  }
}
