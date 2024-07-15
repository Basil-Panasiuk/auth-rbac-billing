import { FactoryProvider } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import redisConfig from './config/redis.config';
import { ConfigType } from '@nestjs/config';

export const redisClientFactory: FactoryProvider<Redis> = {
  provide: REDIS_CLIENT,
  useFactory: (redisConfiguration: ConfigType<typeof redisConfig>) => {
    const redisInstance = new Redis({
      host: redisConfiguration.host,
      port: +redisConfiguration.port,
    });

    redisInstance.on('error', (err) => {
      throw new Error(`Redis connection failed: ${err}`);
    });

    return redisInstance;
  },
  inject: [redisConfig.KEY],
};
