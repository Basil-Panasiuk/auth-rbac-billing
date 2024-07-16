import { ApiProperty } from '@nestjs/swagger';

class ValidationDetails {
  @ApiProperty({ example: ['The page must be an integer.'] })
  page?: string[];

  @ApiProperty({ example: ['The count must be at least 1.'] })
  count?: string[];
}

export class PaginationValidationErrorsDto {
  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({ type: ValidationDetails })
  fails: ValidationDetails;
}
