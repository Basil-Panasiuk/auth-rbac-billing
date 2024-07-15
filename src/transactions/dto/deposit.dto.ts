import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class DepositDto {
  @Type(() => Number)
  @IsNotEmpty({
    message: 'amount:The amount field is required.',
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'amount:The amount must be a number with up to 2 decimal places.',
    },
  )
  @IsPositive({ message: 'amount:The amount must be a positive value.' })
  amount: number;
}
