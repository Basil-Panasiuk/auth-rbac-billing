import { TransactionResponseDto } from 'src/transactions/dto/transaction-response.dto';

export class PaginatedTransactionsResponseDto {
  total_pages: number;
  total_transactions: number;
  count: number;
  page: number;
  data: TransactionResponseDto[];
}
