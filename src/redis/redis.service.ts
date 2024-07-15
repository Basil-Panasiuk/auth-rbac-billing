import { Injectable } from '@nestjs/common';
import { RedisRepository } from './redis.repository';

export class InvalidatedRefreshTokenError extends Error {}

@Injectable()
export class RedisService {
  constructor(private readonly redisRepository: RedisRepository) {}

  storeRefreshToken(userId: number, tokenId: string) {
    return this.redisRepository.set(this.getUserKey(userId), tokenId);
  }

  async validateRefreshToken(userId: number, tokenId: string) {
    const storedTokenId = await this.redisRepository.get(
      this.getUserKey(userId),
    );

    if (storedTokenId !== tokenId) {
      throw new InvalidatedRefreshTokenError();
    }

    return true;
  }

  invalidateRefreshToken(userId: number) {
    return this.redisRepository.remove(this.getUserKey(userId));
  }

  private getUserKey(userId: number): string {
    return `user-${userId}`;
  }
}
