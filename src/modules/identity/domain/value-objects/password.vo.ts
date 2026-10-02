import { ValueObject } from '../../../../core/domain/value-object.base.js';
import { Result } from '../../../../core/logic/result.js';

interface PasswordProps {
  value: string;
}

export class Password extends ValueObject<PasswordProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: PasswordProps) {
    super(props);
  }

  public static create(password: string): Result<Password> {
    if (!password || password.length < 8) {
      return Result.fail<Password>('A senha deve conter no mínimo 8 caracteres.');
    }

    if (password.length > 128) {
      return Result.fail<Password>('A senha não pode exceder 128 caracteres.');
    }

    if (!/[A-Z]/.test(password)) {
      return Result.fail<Password>('A senha deve conter pelo menos uma letra maiúscula.');
    }

    if (!/[a-z]/.test(password)) {
      return Result.fail<Password>('A senha deve conter pelo menos uma letra minúscula.');
    }

    if (!/[0-9]/.test(password)) {
      return Result.fail<Password>('A senha deve conter pelo menos um número.');
    }

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_\-+=~\[\]\\/]/;
    if (!specialCharRegex.test(password)) {
      return Result.fail<Password>('A senha deve conter pelo menos um caractere especial (ex: !@#$%^&*).');
    }

    return Result.ok<Password>(new Password({ value: password }));
  }
}
