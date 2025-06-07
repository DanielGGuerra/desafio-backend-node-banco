import { IsEnum, IsNotEmpty } from 'class-validator';

export class GetTransactionQuery {
  @IsNotEmpty()
  @IsEnum(['paid', 'received'])
  type: 'paid' | 'received';
}
