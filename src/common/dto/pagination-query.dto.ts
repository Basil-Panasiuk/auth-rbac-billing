import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class PaginationQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'page:The page must be an integer.' })
  @IsPositive({ message: 'page:The page must be at least 1.' })
  page: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'count:The count must be an integer.' })
  @IsPositive({ message: 'count:The count must be at least 1.' })
  count: number = 5;
}
