import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserResponseDto } from './dto/user-response.dto';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { TransactionType } from 'src/transactions/enums/transaction-type.enum';
import { TransactionsService } from 'src/transactions/transactions.service';
import { ActiveUserData } from 'src/iam/interfaces/active-user-data.interface';
import { Role } from './enums/role.enum';
import { TransactionStatus } from 'src/transactions/enums/transaction-status.enum';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    private readonly transactionsService: TransactionsService,
    private readonly redisService: RedisService,
  ) {}

  async findOne(id: number) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException({
        message: `User #${id} not found`,
      });
    }

    return user;
  }

  async getDeposits(userId: number, { count, page }: PaginationQueryDto) {
    const [deposits, total] = await this.transactionsRepository.findAndCount({
      where: { type: TransactionType.DEPOSIT, receiverId: userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * count,
      take: count,
    });
    const totalPages = Math.ceil(total / count);
    if (page > totalPages && total) {
      throw new NotFoundException({
        message: 'Page not found',
      });
    }
    return {
      total_pages: totalPages,
      total_transactions: total,
      count,
      page,
      data: deposits.map((deposit) =>
        this.transactionsService.toResponseTransaction(deposit),
      ),
    };
  }

  async getTransfers(userId: number, { count, page }: PaginationQueryDto) {
    const [transfers, total] = await this.transactionsRepository.findAndCount({
      where: [
        { senderId: userId, type: TransactionType.TRANSFER },
        { receiverId: userId, type: TransactionType.TRANSFER },
      ],
      relations: ['receiver', 'sender'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * count,
      take: count,
    });
    const totalPages = Math.ceil(total / count);
    if (page > totalPages && total) {
      throw new NotFoundException({
        message: 'Page not found',
      });
    }
    return {
      total_pages: totalPages,
      total_transactions: total,
      count,
      page,
      data: transfers.map((transfer) => {
        return this.transactionsService.toResponseTransaction(transfer);
      }),
    };
  }

  async deactivate(userId: number, activeUser: ActiveUserData) {
    const isAdmin = activeUser.role === Role.ADMIN;

    if (!isAdmin && userId !== activeUser.sub) {
      throw new ForbiddenException('User has not correct rights');
    }

    const deactivatedUser = await this.usersRepository.manager.transaction(
      async (entityManager: EntityManager) => {
        const user = await this.findOne(userId);
        user.isActive = false;

        await entityManager.save(user);
        this.redisService.invalidateRefreshToken(user.id);

        const pendingTransactions = await this.transactionsRepository.find({
          where: [
            { senderId: userId, status: TransactionStatus.PENDING },
            { receiverId: userId, status: TransactionStatus.PENDING },
          ],
        });

        for (const transaction of pendingTransactions) {
          transaction.status = TransactionStatus.FAILED;
          transaction.reasonOfFail = 'Sender or receiver has been deactivated';
          const failedTransaction = await entityManager.save(transaction);
          await this.transactionsService.sendToWebhook(failedTransaction);
        }

        return user;
      },
    );

    return this.toUserResponseDto(deactivatedUser);
  }

  toUserResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      balance: user.balance,
      isActive: user.isActive,
    };
  }
}
