import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { Transaction, User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { BadRequestException } from '@nestjs/common';
import { DepositDTO } from './dto/deposit.dto';
import { TransferDTO } from './dto/transfer.dto';
import { ResponseTransactionDTO } from './dto/response-transaction.dto';

describe('WalletController', () => {
  let controller: WalletController;
  let walletService: WalletService;

  const userMock: User = {
    id: 'valid_id',
    name: 'valid_name',
    balance: new Decimal(100),
    email: 'valid_email',
    password: 'valid_password',
    createdAt: new Date('2025-06-05T13:00'),
    updatedAt: new Date('2025-06-05T13:00'),
  };

  const transactionMock: Transaction = {
    id: 'transaction_id',
    type: 'deposit',
    status: 'completed',
    amount: new Decimal(50),
    payerBalanceBefore: new Decimal(100),
    payerBalanceAfter: new Decimal(150),
    payerId: 'valid_id',
    createdAt: new Date('2025-06-05T13:00'),
    updatedAt: new Date('2025-06-05T13:00'),
    statusMotive: null,
    payeeId: null,
    chargeBackTransactionId: null,
    reversedTransactionId: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: {
            balance: jest.fn(),
            deposit: jest.fn(),
            transfer: jest.fn(),
            chargeback: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WalletController>(WalletController);
    walletService = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(walletService).toBeDefined();
  });

  describe('getBalance', () => {
    it('should return the user balance', async () => {
      const expectedBalance = new Decimal(100);
      (walletService.balance as jest.Mock).mockResolvedValue(expectedBalance);

      const result = await controller.getBalance(userMock);

      expect(result).toEqual(expectedBalance);
      expect(walletService.balance).toHaveBeenCalledWith(userMock.id);
      expect(walletService.balance).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if balance check fails', async () => {
      (walletService.balance as jest.Mock).mockRejectedValue(
        new BadRequestException('Failed to get balance'),
      );

      await expect(controller.getBalance(userMock)).rejects.toThrow(
        BadRequestException,
      );
      expect(walletService.balance).toHaveBeenCalledWith(userMock.id);
      expect(walletService.balance).toHaveBeenCalledTimes(1);
    });
  });

  describe('deposit', () => {
    it('should create a deposit transaction', async () => {
      const depositDto: DepositDTO = { amount: 50 };
      (walletService.deposit as jest.Mock).mockResolvedValue(transactionMock);

      const result = await controller.deposit(userMock, depositDto);

      expect(result).toBeInstanceOf(ResponseTransactionDTO);
      expect(result).toEqual(new ResponseTransactionDTO(transactionMock));
      expect(walletService.deposit).toHaveBeenCalledWith(
        userMock.id,
        new Decimal(depositDto.amount),
      );
      expect(walletService.deposit).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if deposit fails', async () => {
      const depositDto: DepositDTO = { amount: 50 };
      (walletService.deposit as jest.Mock).mockRejectedValue(
        new BadRequestException('Failed to deposit'),
      );

      await expect(controller.deposit(userMock, depositDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(walletService.deposit).toHaveBeenCalledWith(
        userMock.id,
        new Decimal(depositDto.amount),
      );
      expect(walletService.deposit).toHaveBeenCalledTimes(1);
    });
  });

  describe('transfer', () => {
    it('should create a transfer transaction', async () => {
      const transferDto: TransferDTO = {
        payeeId: 'payee_id',
        amount: 50,
      };
      (walletService.transfer as jest.Mock).mockResolvedValue(transactionMock);

      const result = await controller.transfer(userMock, transferDto);

      expect(result).toBeInstanceOf(ResponseTransactionDTO);
      expect(result).toEqual(new ResponseTransactionDTO(transactionMock));
      expect(walletService.transfer).toHaveBeenCalledWith({
        payerId: userMock.id,
        payeeId: transferDto.payeeId,
        amount: new Decimal(transferDto.amount),
      });
      expect(walletService.transfer).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if transfer fails', async () => {
      const transferDto: TransferDTO = {
        payeeId: 'payee_id',
        amount: 50,
      };
      (walletService.transfer as jest.Mock).mockRejectedValue(
        new BadRequestException('Failed to transfer'),
      );

      await expect(controller.transfer(userMock, transferDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(walletService.transfer).toHaveBeenCalledWith({
        payerId: userMock.id,
        payeeId: transferDto.payeeId,
        amount: new Decimal(transferDto.amount),
      });
      expect(walletService.transfer).toHaveBeenCalledTimes(1);
    });
  });

  describe('chargeback', () => {
    it('should create a chargeback transaction', async () => {
      const transactionId = 'transaction_id';
      (walletService.chargeback as jest.Mock).mockResolvedValue(
        transactionMock,
      );

      const result = await controller.chargeback(userMock, transactionId);

      expect(result).toBeInstanceOf(ResponseTransactionDTO);
      expect(result).toEqual(new ResponseTransactionDTO(transactionMock));
      expect(walletService.chargeback).toHaveBeenCalledWith(
        userMock.id,
        transactionId,
      );
      expect(walletService.chargeback).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if chargeback fails', async () => {
      const transactionId = 'transaction_id';
      (walletService.chargeback as jest.Mock).mockRejectedValue(
        new BadRequestException('Failed to chargeback'),
      );

      await expect(
        controller.chargeback(userMock, transactionId),
      ).rejects.toThrow(BadRequestException);
      expect(walletService.chargeback).toHaveBeenCalledWith(
        userMock.id,
        transactionId,
      );
      expect(walletService.chargeback).toHaveBeenCalledTimes(1);
    });
  });
});
