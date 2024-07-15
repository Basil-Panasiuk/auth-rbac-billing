import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseFilters,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { SignUpDto } from './dto/sign-up.dto';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { ValidationExeptionFilter } from 'src/common/filters/validation-exeption.filter';
import { SignInDto } from './dto/sign-in.dto';
import { Request, Response } from 'express';
import { TokenType } from './enums/token-type.enum';
import { ActiveUser } from '../decorators/active-user.decorator';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import {
  ApiCookieAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SignUpResponseDto } from './dto/sign-up-response.dto';
import { AuthValidationErrorsDto } from './dto/auth-validation-error.dto';
import { SignInResponseDto } from './dto/sign-in-response.dto';

@ApiTags('authentication')
@Auth(AuthType.NONE)
@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('sign-up')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'New user successfully registered',
    type: SignUpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    type: AuthValidationErrorsDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  @UseFilters(new ValidationExeptionFilter('Validation failed'))
  async signUp(@Body() signUpDto: SignUpDto) {
    const user = await this.authService.signUp(signUpDto);

    return {
      message: 'New user successfully registered',
      userId: user.id,
    };
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in a user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: SignInResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    type: AuthValidationErrorsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'User does not exists',
  })
  @ApiResponse({
    status: 403,
    description: 'User has been deactivated',
  })
  @UseFilters(new ValidationExeptionFilter('Validation failed'))
  async signIn(
    @Res({ passthrough: true }) response: Response,
    @Body() signInDto: SignInDto,
  ) {
    const { tokens, user } = await this.authService.signIn(signInDto);
    await this.authService.persistCookies(response, tokens);
    return {
      message: 'User successfully logged in',
      user,
    };
  }

  @ApiCookieAuth()
  @ApiHeader({
    name: 'Cookie',
    description: 'refreshToken',
    example: 'refreshToken=sample-refresh-token',
  })
  @Post('refresh-tokens')
  @Auth(AuthType.BEARER)
  @ApiOperation({ summary: 'Update refreshToken and accessToken in cookies' })
  @ApiResponse({
    status: 200,
    description: 'Tokens were updated',
    content: {
      'application/json': {
        example: { message: 'Tokens were updated' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthirized',
    content: {
      'application/json': {
        examples: {
          noToken: {
            value: { message: 'Refresh token is not provided' },
          },
          accessDenied: { value: { message: 'Access denied' } },
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies[TokenType.REFRESH] ?? null;

    if (!refreshToken) {
      throw new UnauthorizedException({
        message: 'Refresh token is not provided',
      });
    }

    const tokens = await this.authService.refreshTokens(refreshToken);
    await this.authService.persistCookies(response, tokens);

    return { message: 'Tokens were updated' };
  }

  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Logging out',
    content: {
      'application/json': {
        example: { message: 'You have been successfully logged out.' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthirized',
    content: {
      'application/json': {
        examples: {
          noAccessToken: {
            value: { message: 'Token not found.' },
          },
        },
      },
    },
  })
  @Auth(AuthType.BEARER)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Res({ passthrough: true }) response: Response,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    await this.authService.logout(response, activeUser.sub);

    return { message: 'You have been successfully logged out.' };
  }
}
