import UserSeeder from './seeds/user.seeder';
import { DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import { config } from 'dotenv';
import { User } from './../users/entities/user.entity';
import { Transaction } from './../transactions/entities/transaction.entity';

config();

export const dataSourceOptions: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: +process.env.DATABASE_PORT,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [User, Transaction],
  synchronize: true,
  seeds: [UserSeeder],
};
