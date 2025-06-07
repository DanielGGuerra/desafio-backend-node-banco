import { StatusTransaction, TypeTransaction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type TransferParams = {
  payerId: string;
  payeeId: string;
  amount: Decimal;
};

export type GetTransactionsParams = {
  userId: string;
  userRole: 'payer' | 'payee';
  type?: TypeTransaction;
  status?: StatusTransaction;
  payeeId?: string;
};
