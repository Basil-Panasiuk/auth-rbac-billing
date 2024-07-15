import { Role } from '../enums/role.enum';

export class UserResponseDto {
  id: number;
  email: string;
  role: Role;
  balance: number;
  isActive: boolean;
}
