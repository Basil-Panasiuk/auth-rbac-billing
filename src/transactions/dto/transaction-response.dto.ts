import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionType } from '../enums/transaction-type.enum';

export class TransactionResponseDto {
  id: number;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  reasonOfFail?: string;
  createdAt: Date;
  updatedAt: Date;
  sender?: UserResponseDto;
  receiver?: UserResponseDto;
  senderId?: number;
  receiverId?: number;
}
