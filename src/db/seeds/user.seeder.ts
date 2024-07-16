import { BcryptService } from '../../iam/hashing/bcrypt.service';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/enums/role.enum';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';

export default class UserSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);
    const hashingService = new BcryptService();
    const hashedPassword = await hashingService.hash('sudoadmin');

    await userRepository.insert({
      email: 'admin@example.com',
      password: hashedPassword,
      role: Role.ADMIN,
      balance: 100,
      isActive: true,
    });
  }
}
