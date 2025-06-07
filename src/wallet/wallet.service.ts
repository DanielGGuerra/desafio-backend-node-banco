import { Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async balance(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('Wallet not found');
    }

    const balance = new Decimal(user.balance);

    return balance.toFixed(2);
  }
}
