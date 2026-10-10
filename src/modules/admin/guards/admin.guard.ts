import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userPayload = request.user;

    if (!userPayload || !userPayload.sub) {
      throw new UnauthorizedException('Sessão inválida ou não informada.');
    }

    // 1. Buscar o usuário atualizado no banco de dados
    const user = await this.prisma.user.findUnique({
      where: { id: userPayload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isSuspended: true,
      },
    });

    if (!user || user.isSuspended) {
      throw new ForbiddenException('Acesso negado: Conta suspensa ou inexistente.');
    }

    const hasAdminRole = user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'MODERATOR';

    if (!hasAdminRole) {
      throw new ForbiddenException(
        'Acesso restrito: Requer privilégios de Administrador ou Moderador.',
      );
    }

    // Injeta detalhes completos do admin na requisição
    request.adminUser = user;
    return true;
  }
}
