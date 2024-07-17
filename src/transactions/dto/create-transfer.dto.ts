import { Type } from 'class-transformer';
import { IsNotEmpty, IsPositive } from 'class-validator';
import { DepositDto } from './deposit.dto';

export class CreateTransferDto extends DepositDto {
  @Type(() => Number)
  @IsNotEmpty({
    message: 'receiverId:The receiver id field is required',
  })
  @IsPositive({
    message: 'receiverId:The receiver id must be a positive value',
  })
  receiverId: number;
}
