import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { DepositDto } from './dto/deposit.dto';
import { ActiveUser } from 'src/iam/decorators/active-user.decorator';
import { TransactionsService } from './transactions.service';
import { ValidationExeptionFilter } from 'src/common/filters/validation-exeption.filter';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ActiveUserData } from 'src/iam/interfaces/active-user-data.interface';
import { CancelTransferParamDto } from './dto/cancel-transfer-param.dto';
import { Roles } from 'src/iam/authorization/decorators/roles.decorator';
import { Role } from 'src/users/enums/role.enum';
import { ApproveTransferParamDto } from './dto/approve-transfer-param.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginatedTransactionsResponseDto } from 'src/common/dto/paginated-transactions-response.dto';
import { ApiUnauthorizedResponseConfig } from 'src/iam/authentication/common/apiUnauthorizedResponse.config';
import { PaginationValidationErrorsDto } from 'src/common/dto/pagination-validation-errors.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';

@ApiTags('transactions')
@ApiCookieAuth()
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
  content: {
    'application/json': {
      examples: ApiUnauthorizedResponseConfig,
    },
  },
})
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get paginated transactions (only for admins)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of transactions with pagination',
    type: PaginatedTransactionsResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Error: Forbidden',
    content: {
      'application/json': {
        example: {
          message: 'Forbidden resource',
          error: 'Forbidden',
          statusCode: 403,
        },
      },
    },
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
  async findAll(@Query() paginationQueryDto: PaginationQueryDto) {
    return this.transactionsService.findAll(paginationQueryDto);
  }

  @Post('deposit')
  @ApiOperation({
    summary: 'Create deposit',
  })
  @ApiResponse({
    status: 201,
    description: 'Deposit has been done successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Error: Unprocessable Entity',
    content: {
      'application/json': {
        example: {
          message: 'Validation failed',
          fails: {
            amount: ['The amount must be a number with up to 2 decimal places'],
          },
        },
      },
    },
  })
  @UseFilters(new ValidationExeptionFilter('Validation failed'))
  async deposit(
    @Body() depositDto: DepositDto,
    @ActiveUser('sub') userId: number,
  ) {
    return this.transactionsService.deposit(userId, depositDto.amount);
  }

  @Post('transfer')
  @ApiOperation({
    summary: 'Create transfer (with PENDING status for further processing)',
  })
  @ApiResponse({
    status: 201,
    description: 'Transfer has been created successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    content: {
      'application/json': {
        example: { message: 'Receiver has been deactivated' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Receiver not found',
    content: {
      'application/json': {
        example: { message: 'User #{id} not found' },
      },
    },
  })
  @ApiResponse({
    status: 422,
    description: 'Error: Unprocessable Entity',
    content: {
      'application/json': {
        example: {
          message: 'Validation failed',
          fails: {
            amount: ['Insufficient balance'],
            receiverId: ['The receiver id must be a positive value'],
          },
        },
      },
    },
  })
  @UseFilters(new ValidationExeptionFilter('Validation failed'))
  async createTransfer(
    @Body() createTransferDto: CreateTransferDto,
    @ActiveUser('sub') userId: number,
  ) {
    return this.transactionsService.createTransfer(userId, createTransferDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel transaction' })
  @ApiResponse({
    status: 200,
    description: 'Transfer has been canceled successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transaction id',
    content: {
      'application/json': {
        example: {
          message: 'The transfer with the requested id does not exist',
          fails: {
            transactionId: ['The transaction id must be an integer'],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden (for deposits OR with NOT PENDING status OR user with restrictions)',
    content: {
      'application/json': {
        examples: {
          transactionRestrictions: {
            value: { message: 'Forbidden to process operation' },
          },
          userRestrictions: {
            value: { message: 'User has not correct rights' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
    content: {
      'application/json': {
        example: { message: 'Transaction not found' },
      },
    },
  })
  @UseFilters(
    new ValidationExeptionFilter(
      'The transfer with the requested id does not exist',
      HttpStatus.BAD_REQUEST,
    ),
  )
  async cancelTransfer(
    @Param() cancelTransferParamDto: CancelTransferParamDto,
    @ActiveUser() activeUser: ActiveUserData,
  ) {
    return this.transactionsService.cancelTransfer(
      cancelTransferParamDto.id,
      activeUser,
    );
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Approve transaction (only for admins)' })
  @ApiResponse({
    status: 200,
    description: 'Transfer has been approved successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transaction id',
    content: {
      'application/json': {
        example: {
          message: 'The transfer with the requested id does not exist',
          fails: {
            transactionId: ['The transaction id must be a positive value'],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    content: {
      'application/json': {
        examples: {
          transactionRestrictions: {
            value: { message: 'Forbidden to process operation' },
          },
          balanceRestrictions: {
            value: { message: 'Sender has Insufficient balance' },
          },
          roleAccess: {
            value: { message: 'Forbidden resource' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
    content: {
      'application/json': {
        example: { message: 'Transaction not found' },
      },
    },
  })
  @UseFilters(
    new ValidationExeptionFilter(
      'The transfer with the requested id does not exist',
      HttpStatus.BAD_REQUEST,
    ),
  )
  async approveTransfer(
    @Param() approveTransferParamDto: ApproveTransferParamDto,
  ) {
    return this.transactionsService.approveTransfer(approveTransferParamDto.id);
  }
}
