import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { PASSWORD_HASHER_PORT } from '../core/ports/security/password-hasher.port.js';
import type { IPasswordHasherPort } from '../core/ports/security/password-hasher.port.js';
import { TOKEN_SERVICE_PORT } from '../core/ports/security/token-service.port.js';
import type { ITokenServicePort } from '../core/ports/security/token-service.port.js';
import { Email } from '../modules/identity/domain/value-objects/email.vo.js';
import { Username } from '../modules/identity/domain/value-objects/username.vo.js';
import { Password } from '../modules/identity/domain/value-objects/password.vo.js';

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

  async checkUsername(username: string): Promise<{ available: boolean; message: string }> {
    if (!username || username.trim().length === 0) {
      return { available: false, message: 'Nome de usuário não informado.' };
    }

    const usernameOrError = Username.create(username);
    if (usernameOrError.isFailure) {
      return { available: false, message: usernameOrError.error };
    }

    const cleanUsername = usernameOrError.getValue().value;
    const existing = await this.usersService.findByUsername(cleanUsername);
    if (existing) {
      return { available: false, message: 'Este nome de usuário já está em uso.' };
    }

    return { available: true, message: 'Nome de usuário disponível!' };
  }

  async register(data: { email: string; username: string; password?: string }) {
    // 1. Validar formato de e-mail via Value Object
    const emailOrError = Email.create(data.email || '');
    if (emailOrError.isFailure) {
      throw new BadRequestException(emailOrError.error);
    }

    // 2. Validar formato de nome de usuário via Value Object
    const usernameOrError = Username.create(data.username || '');
    if (usernameOrError.isFailure) {
      throw new BadRequestException(usernameOrError.error);
    }

    // 3. Validar complexidade e segurança da senha via Value Object
    const passwordOrError = Password.create(data.password || '');
    if (passwordOrError.isFailure) {
      throw new BadRequestException(passwordOrError.error);
    }

    // 4. Checar duplicidade de e-mail
    const emailExists = await this.usersService.findByEmail(emailOrError.getValue().value);
    if (emailExists) {
      throw new BadRequestException('Este endereço de e-mail já está cadastrado.');
    }

    // 5. Checar duplicidade de nome de usuário (nickname)
    const usernameExists = await this.usersService.findByUsername(usernameOrError.getValue().value);
    if (usernameExists) {
      throw new BadRequestException('Este nome de usuário já está em uso.');
    }

    const hashedPassword = await this.passwordHasher.hash(passwordOrError.getValue().value);
    const user = await this.usersService.create({
      email: emailOrError.getValue().value,
      username: usernameOrError.getValue().value,
      password: hashedPassword,
    });

    const { password, ...result } = user;
    return result;
  }
}
