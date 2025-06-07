import { Decimal } from '@prisma/client/runtime/library';

export type TransferParams = {
  payerId: string;
  payeeId: string;
  amount: Decimal;
};
