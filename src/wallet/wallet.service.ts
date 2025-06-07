import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { UsersService } from '../users/users.service';
import { Prisma, Transaction } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import {
  GetTransactionsParams,
  TransferParams,
} from './interfaces/wallet.models';

@Injectable()
export class WalletService {
  constructor(
    private usersService: UsersService,
    private prismaService: PrismaService,
  ) {}

  async balance(userId: string): Promise<Decimal> {
    const user = await this.usersService.findOne(userId);
    return user.balance;
  }

  async deposit(userId: string, amount: Decimal): Promise<Transaction> {
    const user = await this.usersService.findOne(userId);

    const currentBalance = user.balance;
    const newBalance = currentBalance.plus(amount);

    const transaction = await this.prismaService.transaction.create({
      data: {
        status: 'pending',
        type: 'deposit',
        amount,
        payerBalanceBefore: currentBalance,
        payerBalanceAfter: newBalance,
        payerId: userId,
      },
    });

    try {
      return await this.prismaService.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { balance: newBalance },
        });

        return await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'completed',
          },
        });
      });
    } catch {
      throw new InternalServerErrorException('Failed to deposit');
    }
  }

  async transfer(params: TransferParams): Promise<Transaction> {
    const amount = new Decimal(params.amount);
    const payer = await this.usersService.findOne(params.payerId);
    const payee = await this.usersService.findOne(params.payeeId);

    const payerBalanceBefore = payer.balance;
    const payerBalanceAfter = payer.balance.minus(amount);

    const transaction = await this.prismaService.transaction.create({
      data: {
        status: 'pending',
        type: 'transfer',
        amount: amount,
        payerBalanceBefore,
        payerBalanceAfter,
        payerId: payer.id,
        payeeId: payee.id,
      },
    });

    if (payerBalanceAfter.lessThan(0)) {
      await this.prismaService.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          statusMotive: 'INSUFFICIENT_BALANCE',
        },
      });

      throw new BadRequestException('Insufficient balance');
    }

    try {
      return await this.prismaService.$transaction(async (tx) => {
        // Update payer balance
        await tx.user.update({
          where: { id: payer.id },
          data: { balance: payer.balance.minus(amount) },
        });

        // Update payee balance
        await tx.user.update({
          where: { id: payee.id },
          data: { balance: payee.balance.add(amount) },
        });

        return await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: 'completed' },
        });
      });
    } catch {
      throw new InternalServerErrorException('Failed to transfer');
    }
  }

  async chargeback(
    payerId: string,
    transactionId: string,
  ): Promise<Transaction> {
    const transactionToReverse =
      await this.prismaService.transaction.findUnique({
        include: {
          payer: true,
          payee: true,
        },
        where: { payerId, id: transactionId },
      });

    if (!transactionToReverse) {
      throw new NotFoundException('Transaction not found');
    }

    if (transactionToReverse.status !== 'completed') {
      throw new BadRequestException('Transaction is not completed');
    }

    if (transactionToReverse.type !== 'transfer') {
      throw new BadRequestException('Transaction is not a transfer');
    }

    const { payer: payerToReverse, payee: payeeToReverse } =
      transactionToReverse;

    if (!payerToReverse || !payeeToReverse) {
      throw new NotFoundException('Payer or payee not found');
    }

    const payerChargeback = payeeToReverse;
    const payeeChargeback = payerToReverse;

    const payerBalanceBefore = payerChargeback.balance;
    const payerBalanceAfter = payerChargeback.balance.minus(
      transactionToReverse.amount,
    );

    const chargebackTransaction = await this.prismaService.transaction.create({
      data: {
        status: 'pending',
        type: 'chargeback',
        amount: transactionToReverse.amount,
        payerBalanceBefore,
        payerBalanceAfter,
        payerId: payerChargeback.id,
        payeeId: payeeChargeback.id,
        reversedTransactionId: transactionToReverse.id,
      },
    });

    if (payerBalanceAfter.lessThan(0)) {
      await this.prismaService.transaction.update({
        where: { id: chargebackTransaction.id },
        data: {
          status: 'failed',
          statusMotive: 'INSUFFICIENT_BALANCE',
        },
      });

      throw new BadRequestException('Payee has insufficient balance');
    }

    try {
      return await this.prismaService.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: payerChargeback.id },
          data: {
            balance: payerChargeback.balance.minus(
              chargebackTransaction.amount,
            ),
          },
        });

        await tx.user.update({
          where: { id: payeeChargeback.id },
          data: {
            balance: payeeChargeback.balance.add(chargebackTransaction.amount),
          },
        });

        await tx.transaction.update({
          where: { id: transactionToReverse.id },
          data: {
            status: 'reversed',
            chargeBackTransactionId: chargebackTransaction.id,
          },
        });

        return await tx.transaction.update({
          where: { id: chargebackTransaction.id },
          data: { status: 'completed' },
        });
      });
    } catch {
      throw new InternalServerErrorException('Failed to chargeback');
    }
  }

  async getTransactions({
    userId,
    userRole,
    ...params
  }: GetTransactionsParams): Promise<Transaction[]> {
    const where: Prisma.TransactionWhereInput = {
      ...params,
    };

    if (userRole === 'payer') {
      where.payerId = userId;
    }

    if (userRole === 'payee') {
      if (!params.payeeId) {
        where.payeeId = userId;
      }
      if (!!params.payeeId && params.payeeId !== userId) {
        throw new BadRequestException('Payee ID does not match user ID');
      }
    }

    const transactions = await this.prismaService.transaction.findMany({
      where,
    });

    return transactions;
  }
}
