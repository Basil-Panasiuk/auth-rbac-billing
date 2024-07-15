import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { Repository } from 'typeorm';
import { Role } from './users/enums/role.enum';
import { HashingService } from './iam/hashing/hashing.service';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
  ) {}

  async seed() {
    const newUser = new User();
    newUser.email = 'admin@example.com';
    newUser.password = await this.hashingService.hash('12345');
    newUser.role = Role.ADMIN;
    newUser.balance = 100;
    newUser.isActive = true;

    await this.userRepository.save(newUser);
  }
}
