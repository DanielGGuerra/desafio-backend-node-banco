import { Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { UsersService } from '../users/users.service';

@Injectable()
export class WalletService {
  constructor(private usersService: UsersService) {}

  async balance(userId: string): Promise<string> {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new NotFoundException('Wallet not found');
    }

    const balance = new Decimal(user.balance);

    return balance.toFixed(2);
  }
}
