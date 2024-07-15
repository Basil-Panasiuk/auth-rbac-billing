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
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedTransactionsResponseDto } from 'src/common/dto/paginated-transactions-response.dto';

@ApiTags('user')
@ApiCookieAuth()
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('deposits')
  @UseFilters(new ValidationExeptionFilter('Validation failed'))
  @ApiResponse({
    status: 200,
    description: 'List of deposits with pagination',
    type: PaginatedTransactionsResponseDto,
  })
  async getDeposits(
    @Query() paginationQueryDto: PaginationQueryDto,
    @ActiveUser('sub') userId: number,
  ) {
    return this.usersService.getDeposits(userId, paginationQueryDto);
  }

  @Get('transfers')
  @ApiResponse({
    status: 200,
    description: 'List of transfers with pagination',
    type: PaginatedTransactionsResponseDto,
  })
  @UseFilters(new ValidationExeptionFilter('Validation failed'))
  async getTransfers(
    @Query() paginationQueryDto: PaginationQueryDto,
    @ActiveUser('sub') userId: number,
  ) {
    return this.usersService.getTransfers(userId, paginationQueryDto);
  }

  @Patch(':id/deactivate')
  @ApiResponse({
    status: 200,
    description: 'User deactivation',
    content: {
      'application/json': {
        example: { message: 'User has been deactivated' },
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
