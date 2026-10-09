import { Injectable, BadRequestException, ForbiddenException, Inject, Optional } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { PASSWORD_HASHER_PORT } from '../core/ports/security/password-hasher.port.js';
import type { IPasswordHasherPort } from '../core/ports/security/password-hasher.port.js';
import { TOKEN_SERVICE_PORT } from '../core/ports/security/token-service.port.js';
import type { ITokenServicePort } from '../core/ports/security/token-service.port.js';
import { EMAIL_SERVICE_PORT } from '../core/ports/communication/email-service.port.js';
import type { IEmailServicePort } from '../core/ports/communication/email-service.port.js';
import { Email } from '../modules/identity/domain/value-objects/email.vo.js';
import { Username } from '../modules/identity/domain/value-objects/username.vo.js';
import { Password } from '../modules/identity/domain/value-objects/password.vo.js';
import { BirthDate } from '../modules/identity/domain/value-objects/birth-date.vo.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AgeClassification, AgeSignalSource } from '@prisma/client';
import crypto from 'node:crypto';
import { BetterStackLoggerService } from '../infrastructure/logging/better-stack-logger.service.js';
import { SystemConfigService } from '../modules/system-config/system-config.service.js';

export const AuthErrorCodes = {
  INVALID_EMAIL: 'AUTH_INVALID_EMAIL',
  INVALID_USERNAME: 'AUTH_INVALID_USERNAME',
  WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  INVALID_BIRTHDATE: 'AUTH_INVALID_BIRTHDATE',
  AGE_RESTRICTED: 'AUTH_AGE_RESTRICTED',
  EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS: 'AUTH_USERNAME_ALREADY_EXISTS',
  USERNAME_AVAILABLE: 'AUTH_USERNAME_AVAILABLE',
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  INVALID_VERIFICATION_CODE: 'AUTH_INVALID_VERIFICATION_CODE',
  VERIFICATION_CODE_EXPIRED: 'AUTH_VERIFICATION_CODE_EXPIRED',
  ACCOUNT_CHILD_RESTRICTED: 'AUTH_ACCOUNT_CHILD_RESTRICTED',
  ACCOUNT_SUSPENDED: 'AUTH_ACCOUNT_SUSPENDED',
  BETA_LIMIT_REACHED: 'AUTH_BETA_LIMIT_REACHED',
  TERMS_NOT_ACCEPTED: 'AUTH_TERMS_NOT_ACCEPTED',
} as const;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    @Inject(TOKEN_SERVICE_PORT) private tokenService: ITokenServicePort,
    @Inject(PASSWORD_HASHER_PORT) private passwordHasher: IPasswordHasherPort,
    @Inject(EMAIL_SERVICE_PORT) private emailService: IEmailServicePort,
    @Optional() private logger?: BetterStackLoggerService,
    @Optional() private systemConfigService?: SystemConfigService,
  ) {}

  async validateUser(emailOrUsername: string, pass: string): Promise<any> {
    const cleanIdentifier = (emailOrUsername || '').trim();
    const user =
      (await this.usersService.findByEmail(cleanIdentifier)) ||
      (await this.usersService.findByUsername(cleanIdentifier));
    if (user && (await this.passwordHasher.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    if (user.isSuspended) {
      this.logger?.warn(`Acesso negado: Conta suspensa tentou logar: ${user.id}`, 'AuthService', {
        userId: user.id,
        username: user.username,
        reason: user.suspendedReason,
      });
      throw new ForbiddenException({
        code: AuthErrorCodes.ACCOUNT_SUSPENDED,
        message: user.suspendedReason || 'Esta conta foi suspensa por violação das Diretrizes da Comunidade e Proteção à Criança e ao Adolescente.',
      });
    }

    if (user.ageClassification === AgeClassification.CHILD) {
      this.logger?.warn(`Acesso negado: Conta restrita (CHILD) tentou logar: ${user.id}`, 'AuthService', {
        userId: user.id,
        username: user.username,
      });
      throw new ForbiddenException({
        code: AuthErrorCodes.ACCOUNT_CHILD_RESTRICTED,
        message: 'O acesso a esta conta não é permitido para menores de 13 anos (CHILD).',
      });
    }

    this.logger?.logBusinessEvent('USER_LOGGED_IN', {
      userId: user.id,
      username: user.username,
      ageClassification: user.ageClassification,
    });

    if (!user.isEmailVerified) {
      // Reenvia código se necessário
      await this.generateAndSendCode(user.email, user.username).catch(() => {});
      return {
        requireEmailVerification: true,
        email: user.email,
        message: 'Por favor, confirme seu endereço de e-mail para continuar.',
      };
    }

    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.tokenService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        ageClassification: user.ageClassification,
        ageSignalSource: user.ageSignalSource,
        canShareScreen: user.ageClassification === AgeClassification.ADULT,
        canStreamGames: user.ageClassification === AgeClassification.ADULT || user.ageClassification === AgeClassification.TEEN,
        canAccess18Plus: user.ageClassification === AgeClassification.ADULT,
        canUseApp: user.ageClassification !== AgeClassification.CHILD,
      },
    };
  }

  async checkUsername(username: string): Promise<{ available: boolean; code: string; message: string }> {
    if (!username || username.trim().length === 0) {
      return {
        available: false,
        code: AuthErrorCodes.INVALID_USERNAME,
        message: 'Nome de usuário não informado.',
      };
    }

    const usernameOrError = Username.create(username);
    if (usernameOrError.isFailure) {
      return {
        available: false,
        code: AuthErrorCodes.INVALID_USERNAME,
        message: usernameOrError.error ?? 'Nome de usuário inválido.',
      };
    }

    const cleanUsername = usernameOrError.getValue().value;
    const existing = await this.usersService.findByUsername(cleanUsername);
    if (existing) {
      return {
        available: false,
        code: AuthErrorCodes.USERNAME_ALREADY_EXISTS,
        message: 'Este nome de usuário já está em uso.',
      };
    }

    return {
      available: true,
      code: AuthErrorCodes.USERNAME_AVAILABLE,
      message: 'Nome de usuário disponível!',
    };
  }

  private async generateAndSendCode(email: string, username: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await this.prisma.emailVerification.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    await this.emailService.sendVerificationEmail({
      to: email,
      username,
      code,
    });

    return code;
  }

  async getBetaStatus(): Promise<{
    isOpen: boolean;
    currentUsers: number;
    maxUsers: number;
    remainingSlots: number;
  }> {
    if (this.systemConfigService) {
      const appStatus = await this.systemConfigService.getAppStatus();
      return {
        isOpen: appStatus.isBetaOpen,
        currentUsers: appStatus.currentUsers,
        maxUsers: appStatus.maxBetaUsers,
        remainingSlots: appStatus.remainingSlots,
      };
    }

    const rawLimit = process.env.MAX_BETA_USERS;
    const maxUsers = rawLimit !== undefined && rawLimit !== '' ? parseInt(rawLimit, 10) : 50;
    const currentUsers = await this.prisma.user.count();

    const isUnlimited = maxUsers <= 0;
    const remainingSlots = isUnlimited ? 9999 : Math.max(0, maxUsers - currentUsers);
    const isOpen = isUnlimited || remainingSlots > 0;

    return {
      isOpen,
      currentUsers,
      maxUsers: isUnlimited ? 0 : maxUsers,
      remainingSlots,
    };
  }

  async register(data: {
    email: string;
    username: string;
    password?: string;
    birthDate: string;
    acceptTerms?: boolean;
  }) {
    // 0. Checar limite de vagas da fase Beta
    const betaStatus = await this.getBetaStatus();
    if (!betaStatus.isOpen) {
      throw new BadRequestException({
        code: AuthErrorCodes.BETA_LIMIT_REACHED,
        message: `O limite de vagas para a fase beta (${betaStatus.maxUsers} usuários) foi atingido. Novas vagas serão abertas em breve!`,
      });
    }

    // 0.1 Validar consentimento de termos e privacidade
    if (data.acceptTerms !== undefined && !data.acceptTerms) {
      throw new BadRequestException({
        code: AuthErrorCodes.TERMS_NOT_ACCEPTED,
        message: 'Você precisa aceitar os Termos de Uso, Política de Privacidade e Diretrizes da ANPD para continuar.',
      });
    }

    // 1. Validar formato de e-mail via Value Object
    const emailOrError = Email.create(data.email || '');
    if (emailOrError.isFailure) {
      throw new BadRequestException({
        code: AuthErrorCodes.INVALID_EMAIL,
        message: emailOrError.error,
      });
    }

    // 2. Validar formato de nome de usuário via Value Object
    const usernameOrError = Username.create(data.username || '');
    if (usernameOrError.isFailure) {
      throw new BadRequestException({
        code: AuthErrorCodes.INVALID_USERNAME,
        message: usernameOrError.error,
      });
    }

    // 3. Validar complexidade e segurança da senha via Value Object
    const passwordOrError = Password.create(data.password || '');
    if (passwordOrError.isFailure) {
      throw new BadRequestException({
        code: AuthErrorCodes.WEAK_PASSWORD,
        message: passwordOrError.error,
      });
    }

    // 4. Validar Data de Nascimento declarada
    const birthDateOrError = BirthDate.create(data.birthDate);
    if (birthDateOrError.isFailure) {
      throw new BadRequestException({
        code: AuthErrorCodes.INVALID_BIRTHDATE,
        message: birthDateOrError.error,
      });
    }

    const birthDateVO = birthDateOrError.getValue();
    if (birthDateVO.isUnder13()) {
      throw new BadRequestException({
        code: AuthErrorCodes.AGE_RESTRICTED,
        message: 'Você precisa ter pelo menos 13 anos para criar uma conta no Voxy.',
      });
    }

    // 5. Checar duplicidade de e-mail
    const emailExists = await this.usersService.findByEmail(emailOrError.getValue().value);
    if (emailExists) {
      throw new BadRequestException({
        code: AuthErrorCodes.EMAIL_ALREADY_EXISTS,
        message: 'Este endereço de e-mail já está cadastrado.',
      });
    }

    // 6. Checar duplicidade de nome de usuário (nickname)
    const usernameExists = await this.usersService.findByUsername(usernameOrError.getValue().value);
    if (usernameExists) {
      throw new BadRequestException({
        code: AuthErrorCodes.USERNAME_ALREADY_EXISTS,
        message: 'Este nome de usuário já está em uso.',
      });
    }

    const hashedPassword = await this.passwordHasher.hash(passwordOrError.getValue().value);
    const user = await this.usersService.create({
      email: emailOrError.getValue().value,
      username: usernameOrError.getValue().value,
      password: hashedPassword,
      birthDate: birthDateVO.value,
    });

    // 7. Envia código de 6 dígitos via Resend
    await this.generateAndSendCode(user.email, user.username);

    this.logger?.logBusinessEvent('USER_REGISTERED', {
      userId: user.id,
      email: user.email,
      username: user.username,
      ageClassification: user.ageClassification,
      termsAccepted: true,
      termsAcceptedAt: new Date().toISOString(),
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      requireEmailVerification: true,
      message: 'Cadastro realizado com sucesso! Enviamos um código de verificação para o seu e-mail.',
    };
  }

  async verifyEmail(email: string, code: string) {
    if (!email || !code) {
      throw new BadRequestException({
        code: AuthErrorCodes.INVALID_VERIFICATION_CODE,
        message: 'E-mail e código de verificação são obrigatórios.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const latest = await this.prisma.emailVerification.findFirst({
      where: { email: cleanEmail },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      throw new BadRequestException({
        code: AuthErrorCodes.INVALID_VERIFICATION_CODE,
        message: 'Nenhum código de verificação pendente encontrado.',
      });
    }

    if (new Date() > latest.expiresAt) {
      throw new BadRequestException({
        code: AuthErrorCodes.VERIFICATION_CODE_EXPIRED,
        message: 'Código de verificação expirado. Solicite um novo código.',
      });
    }

    if (latest.attempts >= 5) {
      throw new BadRequestException({
        code: AuthErrorCodes.INVALID_VERIFICATION_CODE,
        message: 'Número excessivo de tentativas. Solicite um novo código.',
      });
    }

    if (latest.code !== cleanCode) {
      await this.prisma.emailVerification.update({
        where: { id: latest.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException({
        code: AuthErrorCodes.INVALID_VERIFICATION_CODE,
        message: 'Código de verificação incorreto.',
      });
    }

    // Código válido! Atualiza usuário
    const user = await this.prisma.user.update({
      where: { email: cleanEmail },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Limpa verificações antigas deste e-mail
    await this.prisma.emailVerification.deleteMany({
      where: { email: cleanEmail },
    }).catch(() => {});

    const payload = { username: user.username, sub: user.id };
    const access_token = this.tokenService.sign(payload);

    return {
      success: true,
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isEmailVerified: true,
        ageClassification: user.ageClassification,
        ageSignalSource: user.ageSignalSource,
        canShareScreen: user.ageClassification === AgeClassification.ADULT,
        canStreamGames: user.ageClassification === AgeClassification.ADULT || user.ageClassification === AgeClassification.TEEN,
        canAccess18Plus: user.ageClassification === AgeClassification.ADULT,
        canUseApp: user.ageClassification !== AgeClassification.CHILD,
      },
    };
  }

  async resendCode(email: string) {
    if (!email) {
      throw new BadRequestException('E-mail é obrigatório.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(cleanEmail);
    if (!user) {
      throw new BadRequestException('Usuário não encontrado.');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Este e-mail já foi verificado.');
    }

    // Rate limit: 60 segundos entre reenvios
    const recent = await this.prisma.emailVerification.findFirst({
      where: { email: cleanEmail },
      orderBy: { createdAt: 'desc' },
    });

    if (recent && (Date.now() - new Date(recent.createdAt).getTime()) < 60000) {
      const waitSeconds = Math.ceil((60000 - (Date.now() - new Date(recent.createdAt).getTime())) / 1000);
      throw new BadRequestException(`Aguarde ${waitSeconds} segundos antes de solicitar um novo código.`);
    }

    await this.generateAndSendCode(user.email, user.username);
    return { success: true, message: 'Código reenviado com sucesso.' };
  }

  private readonly processedNonces = new Map<string, number>();

  private validateAndConsumeNonce(nonce: string): boolean {
    const now = Date.now();
    // Limpeza de nonces antigos (> 10 minutos)
    for (const [n, ts] of this.processedNonces.entries()) {
      if (now - ts > 10 * 60 * 1000) {
        this.processedNonces.delete(n);
      }
    }

    if (this.processedNonces.has(nonce)) {
      return false; // Replay attack detectado!
    }

    this.processedNonces.set(nonce, now);
    return true;
  }

  async syncAgeSignal(
    userId: string,
    signal: {
      available: boolean;
      lower?: number;
      upper?: number;
      status?: string;
      nonce?: string;
      timestamp?: number;
      signature?: string;
    }
  ) {
    let classification: AgeClassification = AgeClassification.UNKNOWN;
    let source: AgeSignalSource = AgeSignalSource.NONE;

    if (signal.available && typeof signal.lower === 'number') {
      const secret = process.env.VOXY_AGE_SIGNAL_SECRET || 'v0xy_4g3_s1gn4l_s3cur1ty_pr0t0c0l_2026_k3y';
      let isCryptographicallyVerified = false;

      // 1. Checa presença dos campos criptográficos obrigatórios
      if (signal.signature && signal.nonce && signal.timestamp) {
        const now = Date.now();
        const ageDiff = Math.abs(now - signal.timestamp);

        // 2. Validação da janela de tolerância de tempo (máximo 5 minutos)
        if (ageDiff <= 5 * 60 * 1000) {
          // 3. Validação anti-replay do nonce
          if (this.validateAndConsumeNonce(signal.nonce)) {
            // 4. Recálculo e conferência da assinatura HMAC-SHA256
            const canonicalData = `${signal.available ? 'true' : 'false'}:${signal.lower}:${signal.upper}:${signal.status}:${signal.timestamp}:${signal.nonce}`;
            const expectedSig = crypto.createHmac('sha256', secret).update(canonicalData).digest('hex');

            if (
              expectedSig.length === signal.signature.length &&
              crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signal.signature))
            ) {
              isCryptographicallyVerified = true;
            } else {
              this.logger?.warn(`Assinatura HMAC inválida para o sinal de idade do usuário ${userId}!`, 'SecurityAlert', { userId });
            }
          } else {
            this.logger?.warn(`Replay Attack detectado para o nonce ${signal.nonce} do usuário ${userId}!`, 'SecurityAlert', { userId, nonce: signal.nonce });
          }
        } else {
          this.logger?.warn(`Timestamp expirado para o sinal de idade do usuário ${userId}: diff=${ageDiff}ms`, 'SecurityAlert', { userId, ageDiff });
        }
      } else {
        this.logger?.warn(`Sinal de idade recebido sem assinatura criptográfica para o usuário ${userId}!`, 'SecurityAlert', { userId });
      }

      if (isCryptographicallyVerified) {
        source = AgeSignalSource.WINDOWS_OS;
        if (signal.lower >= 18) {
          classification = AgeClassification.ADULT;
        } else if (signal.lower >= 13 || (signal.upper !== undefined && signal.upper <= 17)) {
          classification = AgeClassification.TEEN;
        } else {
          classification = AgeClassification.CHILD;
        }
      } else {
        // Falha de integridade/autenticidade: rejeita qualquer promoção e mantém UNKNOWN
        classification = AgeClassification.UNKNOWN;
        source = AgeSignalSource.NONE;
      }
    } else {
      // Quando o sinal não estiver disponível, mantém UNKNOWN conforme o fluxo do projeto
      classification = AgeClassification.UNKNOWN;
      source = AgeSignalSource.NONE;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ageClassification: classification,
        ageSignalSource: source,
        ageSignalCheckedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        birthDate: true,
        isEmailVerified: true,
        ageClassification: true,
        ageSignalSource: true,
        ageSignalCheckedAt: true,
      },
    });

    return {
      success: true,
      user: {
        ...updated,
        canShareScreen: updated.ageClassification === AgeClassification.ADULT,
        canStreamGames: updated.ageClassification === AgeClassification.ADULT || updated.ageClassification === AgeClassification.TEEN,
        canAccess18Plus: updated.ageClassification === AgeClassification.ADULT,
        canUseApp: updated.ageClassification !== AgeClassification.CHILD,
      },
      changed: true,
    };
  }
}
