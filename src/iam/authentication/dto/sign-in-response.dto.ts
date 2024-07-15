import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

export class SignInResponseDto {
  @ApiProperty({ example: 'User successfully logged in' })
  message: string;

  @ApiProperty()
  user: UserResponseDto;
}
