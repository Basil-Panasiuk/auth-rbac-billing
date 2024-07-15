import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import jwtConfig from 'src/iam/config/jwt.config';
import { AuthType } from '../enums/auth-type.enum';
import { REQUEST_USER_KEY } from 'src/iam/iam.constants';
import { TokenType } from '../enums/token-type.enum';
import { ActiveUserData } from 'src/iam/interfaces/active-user-data.interface';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromCookie(request);

    if (!token) {
      throw new UnauthorizedException({
        message: 'Token not found.',
      });
    }

    try {
      const payload: ActiveUserData = await this.jwtService.verifyAsync(
        token,
        this.jwtConfiguration,
      );

      request[REQUEST_USER_KEY] = payload;
    } catch {
      throw new UnauthorizedException({
        message: 'The token expired.',
      });
    }

    return true;
  }

  private extractTokenFromCookie(request: Request): string | null {
    const [type, token] = request.cookies[TokenType.ACCESS]?.split(' ') ?? [];
    return type === AuthType.BEARER ? token : null;
  }
}
