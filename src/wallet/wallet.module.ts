import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  providers: [WalletService],
})
export class WalletModule {}
