import { Injectable } from '@nestjs/common';
import { HashingService } from './hashing.service';
import { compare, genSalt, hash as bHash } from 'bcrypt';

@Injectable()
export class BcryptService implements HashingService {
  async hash(data: string): Promise<string> {
    const salt = await genSalt();
    return bHash(data, salt);
  }

  compare(data: string, enctypted: string): Promise<boolean> {
    return compare(data, enctypted);
  }
}
