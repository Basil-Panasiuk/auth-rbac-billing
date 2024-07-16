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
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedTransactionsResponseDto } from 'src/common/dto/paginated-transactions-response.dto';

@ApiTags('transactions')
@ApiCookieAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiResponse({
    status: 200,
    description: 'List of transactions with pagination (only for admin)',
    type: PaginatedTransactionsResponseDto,
  })
  @UseFilters(new ValidationExeptionFilter('Validation failed'))
  async findAll(@Query() paginationQueryDto: PaginationQueryDto) {
    return this.transactionsService.findAll(paginationQueryDto);
  }

  @Post('deposit')
  @UseFilters(new ValidationExeptionFilter('Validation failed'))
  async deposit(
    @Body() depositDto: DepositDto,
    @ActiveUser('sub') userId: number,
  ) {
    const deposit = await this.transactionsService.deposit(
      userId,
      depositDto.amount,
    );

    return {
      message: 'Deposit has been done successfully',
      deposit,
    };
  }

  @Post('transfer')
  @UseFilters(new ValidationExeptionFilter('Validation failed'))
  async createTransfer(
    @Body() createTransferDto: CreateTransferDto,
    @ActiveUser('sub') userId: number,
  ) {
    const transfer = await this.transactionsService.createTransfer(
      userId,
      createTransferDto,
    );

    return {
      message: 'Transfer has been created successfully',
      transfer,
    };
  }

  @Patch(':id/cancel')
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
    const canceledTransfer = await this.transactionsService.cancelTransfer(
      cancelTransferParamDto.id,
      activeUser,
    );

    return {
      message: 'Transfer has been canceled successfully',
      canceledTransfer,
    };
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  @UseFilters(
    new ValidationExeptionFilter(
      'The transfer with the requested id does not exist',
      HttpStatus.BAD_REQUEST,
    ),
  )
  async approveTransfer(
    @Param() approveTransferParamDto: ApproveTransferParamDto,
  ) {
    const approvedTransfer = await this.transactionsService.approveTransfer(
      approveTransferParamDto.id,
    );

    return {
      message: 'Transfer has been approved successfully',
      approvedTransfer,
    };
  }
}
