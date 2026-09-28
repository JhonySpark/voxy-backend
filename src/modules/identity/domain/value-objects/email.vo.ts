import { ValueObject } from '../../../../core/domain/value-object.base.js';
import { Result } from '../../../../core/logic/result.js';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: EmailProps) {
    super(props);
  }

  public static create(email: string): Result<Email> {
    if (!email || email.trim().length === 0) {
      return Result.fail<Email>('Email não pode ser vazio.');
    }

    const cleaned = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleaned)) {
      return Result.fail<Email>('Formato de email inválido.');
    }

    return Result.ok<Email>(new Email({ value: cleaned }));
  }
}
