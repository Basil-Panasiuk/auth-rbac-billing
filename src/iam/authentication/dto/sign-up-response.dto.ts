import { ApiProperty } from '@nestjs/swagger';

export class SignUpResponseDto {
  @ApiProperty({ example: 'New user successfully registered' })
  message: string;

  @ApiProperty({ example: 1 })
  userId: number;
}
