import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class ProcessTransferParamDto {
  @Type(() => Number)
  @IsInt({ message: 'transactionId:The transaction id must be an integer' })
  @IsPositive({
    message: 'transactionId:The transaction id must be a positive value',
  })
  id: number;
}
