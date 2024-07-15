import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class UserParamDto {
  @Type(() => Number)
  @IsInt({ message: 'userId:The user id must be an integer.' })
  @IsPositive({ message: 'userId:The user id must be a positive value.' })
  id: number;
}
