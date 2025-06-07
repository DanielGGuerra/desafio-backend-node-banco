import { StatusTransaction, TypeTransaction } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetTransactionQuery {
  @IsNotEmpty()
  @IsEnum(['payer', 'payee'])
  userRole: 'payer' | 'payee';

  @IsOptional()
  @IsEnum(TypeTransaction)
  type?: TypeTransaction;

  @IsOptional()
  @IsEnum(StatusTransaction)
  status?: StatusTransaction;

  @IsOptional()
  @IsString()
  payeeId?: string;
}
