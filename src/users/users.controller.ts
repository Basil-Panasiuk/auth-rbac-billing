import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseFilters,
} from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ActiveUser } from 'src/iam/decorators/active-user.decorator';
import { UsersService } from './users.service';
import { ValidationExeptionFilter } from 'src/common/filters/validation-exeption.filter';
import { UserParamDto } from './dto/user-param.dto';
import { ActiveUserData } from 'src/iam/interfaces/active-user-data.interface';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginatedTransactionsResponseDto } from 'src/common/dto/paginated-transactions-response.dto';
import { PaginationValidationErrorsDto } from 'src/common/dto/pagination-validation-errors.dto';
import { ApiUnauthorizedResponseConfig } from 'src/iam/authentication/common/apiUnauthorizedResponse.config';
import { Role } from './enums/role.enum';

@ApiTags('user')
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
  content: {
    'application/json': {
      examples: ApiUnauthorizedResponseConfig,
    },
  },
})
@ApiCookieAuth()
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('deposits')
  @UseFilters(new ValidationExeptionFilter('Validation failed'))
  @ApiOperation({ summary: 'Get paginated deposits of user' })
  @ApiResponse({
    status: 200,
    description: 'List of deposits with pagination',
    type: PaginatedTransactionsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Page not found',
    content: {
      'application/json': {
        example: { message: 'Page not found' },
      },
    },
  })
  @ApiResponse({
    status: 422,
    description: 'Validation failed',
    type: PaginationValidationErrorsDto,
  })
  async getDeposits(
    @Query() paginationQueryDto: PaginationQueryDto,
    @ActiveUser('sub') userId: number,
  ) {
    return this.usersService.getDeposits(userId, paginationQueryDto);
  }

  @Get('transfers')
  @ApiOperation({ summary: 'Get paginated transfers of user' })
  @ApiResponse({
    status: 200,
    description: 'List of transfers with pagination',
    type: PaginatedTransactionsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Page not found',
    content: {
      'application/json': {
        example: { message: 'Page not found' },
      },
    },
  })
  @ApiResponse({
    status: 422,
    description: 'Validation failed',
    type: PaginationValidationErrorsDto,
  })
  @UseFilters(new ValidationExeptionFilter('Validation failed'))
  async getTransfers(
    @Query() paginationQueryDto: PaginationQueryDto,
    @ActiveUser('sub') userId: number,
  ) {
    return this.usersService.getTransfers(userId, paginationQueryDto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivation of user' })
  @ApiResponse({
    status: 200,
    description: 'User deactivation',
    content: {
      'application/json': {
        example: {
          message: 'User has been deactivated',
          user: {
            id: 1,
            email: 'example@gmailcom',
            role: Role.REGULAR,
            balance: 9.99,
            isActive: false,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid user id',
    content: {
      'application/json': {
        example: {
          message: 'The user with the requested id does not exist',
          fails: {
            userId: ['The user id must be an integer.'],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'User has not correct rights',
    content: {
      'application/json': {
        example: { message: 'User has not correct rights' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    content: {
      'application/json': {
        example: { message: 'User #{id} not found' },
      },
    },
  })
  @UseFilters(
    new ValidationExeptionFilter(
      'The user with the requested id does not exist',
      HttpStatus.BAD_REQUEST,
    ),
  )
  async deactivate(
    @Param()
    findUserParamDto: UserParamDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    const user = await this.usersService.deactivate(
      findUserParamDto.id,
      activeUser,
    );

    return {
      message: 'User has been deactivated',
      user,
    };
  }
}
