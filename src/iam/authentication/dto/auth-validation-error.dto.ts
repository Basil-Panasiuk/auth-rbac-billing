import { ApiProperty } from '@nestjs/swagger';

class ValidationErrorDetails {
  @ApiProperty({ example: ['The email must be a valid email address.'] })
  email?: string[];

  @ApiProperty({ example: ['The password has contain at least 5 characters.'] })
  password?: string[];
}

export class AuthValidationErrorsDto {
  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({ type: ValidationErrorDetails })
  fails: ValidationErrorDetails;
}
