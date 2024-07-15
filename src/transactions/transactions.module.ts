import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { UsersModule } from 'src/users/users.module';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { ConfigModule } from '@nestjs/config';
import transactionsConfig from './config/transactions.config';

@Module({
  imports: [
    ConfigModule.forFeature(transactionsConfig),
    TypeOrmModule.forFeature([Transaction]),
    forwardRef(() => UsersModule),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
