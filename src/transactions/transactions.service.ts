import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { EntityManager, Repository } from 'typeorm';
import { TransactionType } from './enums/transaction-type.enum';
import { TransactionStatus } from './enums/transaction-status.enum';
import { Transaction } from './entities/transaction.entity';
import transactionsConfig from './config/transactions.config';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ActiveUserData } from 'src/iam/interfaces/active-user-data.interface';
import { Role } from 'src/users/enums/role.enum';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @Inject(transactionsConfig.KEY)
    private readonly transactionsConfiguration: ConfigType<
      typeof transactionsConfig
    >,
  ) {}

  async findAll({ count, page }: PaginationQueryDto) {
    const [transactions, total] =
      await this.transactionsRepository.findAndCount({
        relations: ['sender', 'receiver'],
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
      data: transactions.map((transaction) => {
        return this.toResponseTransaction(transaction);
      }),
    };
  }

  async deposit(userId: number, amount: number) {
    const user = await this.usersService.findOne(userId);

    const deposit = await this.transactionsRepository.manager.transaction(
      async (entityManager: EntityManager) => {
        user.balance = +(user.balance + amount).toFixed(2);

        const depositTransaction = this.transactionsRepository.create({
          amount,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.SUCCEESS,
          receiver: user,
        });

        await entityManager.save(user);
        const savedTransaction = await entityManager.save(depositTransaction);
        await this.sendToWebhook(savedTransaction);

        return savedTransaction;
      },
    );

    return this.toResponseTransaction(deposit);
  }

  async createTransfer(
    userId: number,
    { amount, receiverId }: CreateTransferDto,
  ) {
    const receiver = await this.usersService.findOne(receiverId);
    if (!receiver.isActive) {
      throw new ForbiddenException('Receiver has been deactivated');
    }
    const sender = await this.usersService.findOne(userId);

    if (sender.balance < amount) {
      throw new BadRequestException({
        message: ['amount:Insufficient balance'],
      });
    }

    const transfer = await this.transactionsRepository.manager.transaction(
      async (entityManager: EntityManager) => {
        const transferTransaction = this.transactionsRepository.create({
          amount,
          type: TransactionType.TRANSFER,
          sender,
          receiver,
          status: TransactionStatus.PENDING,
        });

        await entityManager.save(sender);
        await entityManager.save(receiver);
        const savedTransaction = await entityManager.save(transferTransaction);
        await this.sendToWebhook(savedTransaction);

        return savedTransaction;
      },
    );

    return this.toResponseTransaction(transfer);
  }

  async cancelTransfer(
    transferId: number,
    { role, sub: userId }: ActiveUserData,
  ) {
    const transfer = await this.findOne(transferId);
    const isAdmin = role === Role.ADMIN;

    if (
      transfer.type !== TransactionType.TRANSFER ||
      transfer.status !== TransactionStatus.PENDING
    ) {
      throw new ForbiddenException('Forbidden to process operation');
    }

    if (!isAdmin && userId !== transfer.sender?.id) {
      throw new ForbiddenException('User has not correct rights');
    }

    const canceledTransfer =
      await this.transactionsRepository.manager.transaction(
        async (entityManager: EntityManager) => {
          transfer.status = TransactionStatus.CANCELLED;
          transfer.reasonOfFail = isAdmin
            ? 'Admin has canceled'
            : 'Sender has canceled';

          const updatedTransaction = await entityManager.save(transfer);
          await this.sendToWebhook(updatedTransaction);

          return updatedTransaction;
        },
      );

    return this.toResponseTransaction(canceledTransfer);
  }

  async approveTransfer(transferId: number) {
    const transfer = await this.findOne(transferId);
    if (transfer.status !== TransactionStatus.PENDING) {
      throw new ForbiddenException('Forbidden to process operation');
    }

    const receiver = await this.usersService.findOne(transfer.receiver?.id);
    const sender = await this.usersService.findOne(transfer.sender?.id);

    if (sender.balance < transfer.amount) {
      throw new ForbiddenException('Sender has Insufficient balance');
    }

    const approvedTransfer =
      await this.transactionsRepository.manager.transaction(
        async (entityManager: EntityManager) => {
          sender.balance = +(sender.balance - transfer.amount).toFixed(2);
          receiver.balance = +(receiver.balance + transfer.amount).toFixed(2);
          transfer.status = TransactionStatus.SUCCEESS;
          transfer.sender = sender;
          transfer.receiver = receiver;

          await entityManager.save(sender);
          await entityManager.save(receiver);
          const updatedTransaction = await entityManager.save(transfer);
          await this.sendToWebhook(updatedTransaction);

          return updatedTransaction;
        },
      );

    return this.toResponseTransaction(approvedTransfer);
  }

  async findOne(id: number) {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['sender', 'receiver'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async sendToWebhook(transaction: Transaction) {
    try {
      await axios.post(
        this.transactionsConfiguration.webhookUrl,
        this.toResponseTransaction(transaction),
      );
    } catch {
      throw new InternalServerErrorException('Failed to send to Webhook');
    }
  }

  toResponseTransaction(transaction: Transaction): TransactionResponseDto {
    return {
      id: transaction.id,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
      reasonOfFail: transaction.reasonOfFail,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      sender:
        transaction.sender &&
        this.usersService.toUserResponseDto(transaction.sender),
      senderId: transaction.senderId,
      receiver:
        transaction.receiver &&
        this.usersService.toUserResponseDto(transaction.receiver),
      receiverId: transaction.receiverId,
    };
  }
}
