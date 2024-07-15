import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class BaseAuthDto {
  @IsNotEmpty({
    message: 'email:The email field is required.',
  })
  @IsEmail(
    {},
    {
      message: 'email:The email must be a valid email address.',
    },
  )
  email: string;

  @IsNotEmpty({
    message: 'password:The password field is required.',
  })
  @MinLength(5, {
    message: 'password:The password has contain at least 5 characters.',
  })
  password: string;
}
