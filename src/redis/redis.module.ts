import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import redisConfig from './config/redis.config';
import { redisClientFactory } from './redis-client.factory';
import { RedisRepository } from './redis.repository';
import { RedisService } from './redis.service';

@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [redisClientFactory, RedisRepository, RedisService],
  exports: [RedisService],
})
export class RedisModule {}
