import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { UsersService } from '../users/users.service';
import { Transaction } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { TransferParams } from './interfaces/wallet.models';

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
}
