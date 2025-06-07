import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { UsersService } from '../users/users.service';
import { Transaction } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';

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
  }
}
