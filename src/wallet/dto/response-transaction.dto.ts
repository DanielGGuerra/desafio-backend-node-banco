import { Transaction } from '@prisma/client';

export class ResponseTransactionDTO {
  id: string;
  type: string;
  status: string;
  statusMotive?: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  createdAt: Date;
  updatedAt: Date;

  chargeBackReference?: string;
  reversedReference?: string;

  constructor(transaction: Transaction) {
    this.id = transaction.id;
    this.type = transaction.type;
    this.status = transaction.status;
    this.statusMotive = transaction.statusMotive || undefined;
    this.amount = transaction.amount.toFixed(2);
    this.balanceBefore = transaction.payerBalanceBefore.toFixed(2);
    this.balanceAfter = transaction.payerBalanceAfter.toFixed(2);
    this.createdAt = transaction.createdAt;
    this.updatedAt = transaction.updatedAt;
    this.chargeBackReference = transaction.chargeBackTransactionId
      ? transaction.chargeBackTransactionId
      : undefined;
    this.reversedReference = transaction.reversedTransactionId
      ? transaction.reversedTransactionId
      : undefined;
  }
}
