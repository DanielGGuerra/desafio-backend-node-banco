import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { User } from '@prisma/client';
import { GetUser } from '../common/decorators/get-user.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { DepositDTO } from './dto/deposit.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { TransferDTO } from './dto/transfer.dto';
import { ResponseTransactionDTO } from './dto/response-transaction.dto';
import { GetTransactionQuery } from './dto/get-transaction-query.dto';

@UseGuards(JwtGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async getBalance(@GetUser() user: User) {
    return this.walletService.balance(user.id);
  }

  @Post('deposit')
  async deposit(
    @GetUser() user: User,
    @Body() depositDto: DepositDTO,
  ): Promise<ResponseTransactionDTO> {
    const transaction = await this.walletService.deposit(
      user.id,
      new Decimal(depositDto.amount),
    );
    return new ResponseTransactionDTO(transaction);
  }

  @Post('transfer')
  async transfer(
    @GetUser() user: User,
    @Body() transferDto: TransferDTO,
  ): Promise<ResponseTransactionDTO> {
    const transaction = await this.walletService.transfer({
      payerId: user.id,
      payeeId: transferDto.payeeId,
      amount: new Decimal(transferDto.amount),
    });
    return new ResponseTransactionDTO(transaction);
  }

  @Post('transactions/:id/chargeback')
  async chargeback(
    @GetUser() user: User,
    @Param('id') transactionId: string,
  ): Promise<ResponseTransactionDTO> {
    const transaction = await this.walletService.chargeback(
      user.id,
      transactionId,
    );
    return new ResponseTransactionDTO(transaction);
  }

  @Get('transactions')
  async getTransactions(
    @GetUser() user: User,
    @Query() query: GetTransactionQuery,
  ): Promise<ResponseTransactionDTO[]> {
    const transactions =
      query.type === 'paid'
        ? await this.walletService.getAllTransactionsPaidByUser(user.id)
        : await this.walletService.getAllTransactionsReceivedByUser(user.id);

    return transactions.map(
      (transaction) => new ResponseTransactionDTO(transaction),
    );
  }
}
