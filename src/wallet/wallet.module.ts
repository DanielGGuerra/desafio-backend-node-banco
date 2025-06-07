import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { UsersModule } from '../users/users.module';
import { WalletController } from './wallet.controller';

@Module({
  imports: [UsersModule],
  providers: [WalletService],
  controllers: [WalletController],
})
export class WalletModule {}
