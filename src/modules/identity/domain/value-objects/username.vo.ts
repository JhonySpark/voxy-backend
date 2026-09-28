import { ValueObject } from '../../../../core/domain/value-object.base.js';
import { Result } from '../../../../core/logic/result.js';

interface UsernameProps {
  value: string;
}

export class Username extends ValueObject<UsernameProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: UsernameProps) {
    super(props);
  }

  public static create(username: string): Result<Username> {
    if (!username || username.trim().length < 3) {
      return Result.fail<Username>('Nome de usuário deve ter no mínimo 3 caracteres.');
    }

    const trimmed = username.trim();
    if (trimmed.length > 32) {
      return Result.fail<Username>('Nome de usuário não pode exceder 32 caracteres.');
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(trimmed)) {
      return Result.fail<Username>('Nome de usuário deve conter apenas letras, números, sublinhados ou hífens.');
    }

    return Result.ok<Username>(new Username({ value: trimmed }));
  }
}
