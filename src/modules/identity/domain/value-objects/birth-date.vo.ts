import { ValueObject } from '../../../../core/domain/value-object.base.js';
import { Result } from '../../../../core/logic/result.js';

interface BirthDateProps {
  value: Date;
}

export class BirthDate extends ValueObject<BirthDateProps> {
  get value(): Date {
    return this.props.value;
  }

  get age(): number {
    const today = new Date();
    const birthDate = this.props.value;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  public isUnder13(): boolean {
    return this.age < 13;
  }

  public isTeen(): boolean {
    return this.age >= 13 && this.age < 18;
  }

  public isAdult(): boolean {
    return this.age >= 18;
  }

  private constructor(props: BirthDateProps) {
    super(props);
  }

  public static create(rawDate: string | Date): Result<BirthDate> {
    if (!rawDate) {
      return Result.fail<BirthDate>('Data de nascimento é obrigatória.');
    }

    const date = new Date(rawDate);
    if (isNaN(date.getTime())) {
      return Result.fail<BirthDate>('Data de nascimento inválida.');
    }

    const now = new Date();
    if (date >= now) {
      return Result.fail<BirthDate>('A data de nascimento deve estar no passado.');
    }

    const minDate = new Date();
    minDate.setFullYear(now.getFullYear() - 120);
    if (date < minDate) {
      return Result.fail<BirthDate>('Data de nascimento fora do intervalo permitido.');
    }

    return Result.ok<BirthDate>(new BirthDate({ value: date }));
  }
}
