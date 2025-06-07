import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { Transaction, User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { UsersService } from '../users/users.service';
import { PrismaService } from 'nestjs-prisma';
import { TransferParams } from './interfaces/wallet.models';
import { BadRequestException } from '@nestjs/common';

describe('WalletService', () => {
  let service: WalletService;
  let usersService: UsersService;
  let prismaService: PrismaService;

  const userMock: User = {
    id: 'valid_id',
    name: 'valid_name',
    balance: new Decimal(100),
    email: 'valid_email',
    password: 'valid_password',
    createdAt: new Date('2025-06-05T13:00'),
    updatedAt: new Date('2025-06-05T13:00'),
  };

  const transactionDepositMock: Transaction = {
    id: 'valid_id',
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
      providers: [
        WalletService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            transaction: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    usersService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(usersService).toBeDefined();
  });

  describe('balance', () => {
    it('should return the balance of the user', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(userMock);

      const balance = await service.balance('valid_id');

      expect(balance).toEqual(new Decimal(100));
      expect(usersService.findOne).toHaveBeenCalledWith('valid_id');
      expect(usersService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the user is not found', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.balance('invalid_id')).rejects.toThrow();
      expect(usersService.findOne).toHaveBeenCalledTimes(1);
      expect(usersService.findOne).toHaveBeenCalledWith('invalid_id');
    });
  });

  describe('deposit', () => {
    it("should deposit money into the user's wallet", async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(userMock);
      (prismaService.$transaction as jest.Mock).mockResolvedValue(
        transactionDepositMock,
      );

      const transaction = await service.deposit('valid_id', new Decimal(50));

      expect(transaction).toEqual(transactionDepositMock);
      expect(usersService.findOne).toHaveBeenCalledWith('valid_id');
      expect(usersService.findOne).toHaveBeenCalledTimes(1);
      expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaService.transaction.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('transfer', () => {
    it('should transfer money from one user to another', async () => {
      const payer: User = {
        id: 'payer_id',
        name: 'payer_name',
        balance: new Decimal(100),
        email: 'payer_email',
        password: 'payer_password',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
      };

      const payee: User = {
        id: 'payee_id',
        name: 'payee_name',
        balance: new Decimal(0),
        email: 'payee_email',
        password: 'payee_password',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
      };

      const transaction: Transaction = {
        id: 'transaction_id',
        type: 'transfer',
        status: 'completed',
        amount: new Decimal(50),
        payerBalanceBefore: new Decimal(100),
        payerBalanceAfter: new Decimal(50),
        payerId: 'payer_id',
        payeeId: 'payee_id',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
        statusMotive: null,
        chargeBackTransactionId: null,
        reversedTransactionId: null,
      };

      const transferParams: TransferParams = {
        payerId: payer.id,
        payeeId: payee.id,
        amount: new Decimal(50),
      };

      (usersService.findOne as jest.Mock).mockResolvedValueOnce(payer);
      (usersService.findOne as jest.Mock).mockResolvedValueOnce(payee);
      (prismaService.$transaction as jest.Mock).mockResolvedValue(transaction);

      const transferResult = await service.transfer(transferParams);

      expect(transferResult).toEqual(transaction);
      expect(usersService.findOne).toHaveBeenCalledTimes(2);
      expect(usersService.findOne).toHaveBeenCalledWith(payer.id);
      expect(usersService.findOne).toHaveBeenCalledWith(payee.id);
      expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaService.transaction.create).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the payer has insufficient balance', async () => {
      const payer: User = {
        id: 'payer_id',
        name: 'payer_name',
        balance: new Decimal(0),
        email: 'payer_email',
        password: 'payer_password',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
      };

      const payee: User = {
        id: 'payee_id',
        name: 'payee_name',
        balance: new Decimal(0),
        email: 'payee_email',
        password: 'payee_password',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
      };

      const transaction: Transaction = {
        id: 'transaction_id',
        type: 'transfer',
        status: 'failed',
        amount: new Decimal(50),
        payerBalanceBefore: new Decimal(100),
        payerBalanceAfter: new Decimal(50),
        payerId: 'payer_id',
        payeeId: 'payee_id',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
        statusMotive: null,
        chargeBackTransactionId: null,
        reversedTransactionId: null,
      };

      const transferParams: TransferParams = {
        payerId: payer.id,
        payeeId: payee.id,
        amount: new Decimal(50),
      };

      (usersService.findOne as jest.Mock).mockResolvedValueOnce(payer);
      (usersService.findOne as jest.Mock).mockResolvedValueOnce(payee);
      (prismaService.transaction.create as jest.Mock).mockResolvedValue(
        transaction,
      );

      await expect(service.transfer(transferParams)).rejects.toThrow();
      expect(usersService.findOne).toHaveBeenCalledTimes(2);
      expect(usersService.findOne).toHaveBeenCalledWith(payer.id);
      expect(usersService.findOne).toHaveBeenCalledWith(payee.id);
      expect(prismaService.transaction.create).toHaveBeenCalledTimes(1);
      expect(prismaService.transaction.update).toHaveBeenCalledTimes(1);
      expect(prismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          statusMotive: 'INSUFFICIENT_BALANCE',
        },
      });
      expect(prismaService.$transaction).toHaveBeenCalledTimes(0);
    });
  });

  describe('chargeback', () => {
    it('should successfully perform a chargeback', async () => {
      const originalTransaction: Transaction = {
        id: 'original_transaction_id',
        type: 'transfer',
        status: 'completed',
        amount: new Decimal(50),
        payerBalanceBefore: new Decimal(100),
        payerBalanceAfter: new Decimal(50),
        payerId: 'payer_id',
        payeeId: 'payee_id',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
        statusMotive: null,
        chargeBackTransactionId: null,
        reversedTransactionId: null,
      };

      const payer: User = {
        id: 'payer_id',
        name: 'payer_name',
        balance: new Decimal(50),
        email: 'payer_email',
        password: 'payer_password',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
      };

      const payee: User = {
        id: 'payee_id',
        name: 'payee_name',
        balance: new Decimal(50),
        email: 'payee_email',
        password: 'payee_password',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
      };

      const chargebackTransaction: Transaction = {
        id: 'chargeback_transaction_id',
        type: 'chargeback',
        status: 'completed',
        amount: new Decimal(50),
        payerBalanceBefore: new Decimal(50),
        payerBalanceAfter: new Decimal(0),
        payerId: 'payee_id',
        payeeId: 'payer_id',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
        statusMotive: null,
        chargeBackTransactionId: null,
        reversedTransactionId: 'original_transaction_id',
      };

      (prismaService.transaction.findUnique as jest.Mock).mockResolvedValue({
        ...originalTransaction,
        payer,
        payee,
      });

      (prismaService.transaction.create as jest.Mock).mockResolvedValue(
        chargebackTransaction,
      );
      (prismaService.$transaction as jest.Mock).mockResolvedValue(
        chargebackTransaction,
      );

      const result = await service.chargeback(
        'payer_id',
        'original_transaction_id',
      );

      expect(result).toEqual(chargebackTransaction);
      expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
        include: {
          payer: true,
          payee: true,
        },
        where: { payerId: 'payer_id', id: 'original_transaction_id' },
      });
      expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if transaction is not found', async () => {
      (prismaService.transaction.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.chargeback('payer_id', 'invalid_transaction_id'),
      ).rejects.toThrow('Transaction not found');
    });

    it('should throw an error if transaction is not completed', async () => {
      const transaction: Transaction = {
        id: 'transaction_id',
        type: 'transfer',
        status: 'pending',
        amount: new Decimal(50),
        payerBalanceBefore: new Decimal(100),
        payerBalanceAfter: new Decimal(50),
        payerId: 'payer_id',
        payeeId: 'payee_id',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
        statusMotive: null,
        chargeBackTransactionId: null,
        reversedTransactionId: null,
      };

      (prismaService.transaction.findUnique as jest.Mock).mockResolvedValue({
        ...transaction,
        payer: null,
        payee: null,
      });

      await expect(
        service.chargeback('payer_id', 'transaction_id'),
      ).rejects.toThrow('Transaction is not completed');
    });

    it('should throw an error if transaction is not a transfer', async () => {
      const transaction: Transaction = {
        id: 'transaction_id',
        type: 'deposit',
        status: 'completed',
        amount: new Decimal(50),
        payerBalanceBefore: new Decimal(100),
        payerBalanceAfter: new Decimal(150),
        payerId: 'payer_id',
        payeeId: null,
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
        statusMotive: null,
        chargeBackTransactionId: null,
        reversedTransactionId: null,
      };

      (prismaService.transaction.findUnique as jest.Mock).mockResolvedValue({
        ...transaction,
        payer: null,
        payee: null,
      });

      await expect(
        service.chargeback('payer_id', 'transaction_id'),
      ).rejects.toThrow('Transaction is not a transfer');
    });

    it('should throw an error if payer or payee is not found', async () => {
      const transaction: Transaction = {
        id: 'transaction_id',
        type: 'transfer',
        status: 'completed',
        amount: new Decimal(50),
        payerBalanceBefore: new Decimal(100),
        payerBalanceAfter: new Decimal(50),
        payerId: 'payer_id',
        payeeId: 'payee_id',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
        statusMotive: null,
        chargeBackTransactionId: null,
        reversedTransactionId: null,
      };

      (prismaService.transaction.findUnique as jest.Mock).mockResolvedValue({
        ...transaction,
        payer: null,
        payee: null,
      });

      await expect(
        service.chargeback('payer_id', 'transaction_id'),
      ).rejects.toThrow('Payer or payee not found');
    });

    it('should throw an error if payee has insufficient balance', async () => {
      const transaction: Transaction = {
        id: 'transaction_id',
        type: 'transfer',
        status: 'completed',
        amount: new Decimal(50),
        payerBalanceBefore: new Decimal(100),
        payerBalanceAfter: new Decimal(50),
        payerId: 'payer_id',
        payeeId: 'payee_id',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
        statusMotive: null,
        chargeBackTransactionId: null,
        reversedTransactionId: null,
      };

      const payer: User = {
        id: 'payer_id',
        name: 'payer_name',
        balance: new Decimal(50),
        email: 'payer_email',
        password: 'payer_password',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
      };

      const payee: User = {
        id: 'payee_id',
        name: 'payee_name',
        balance: new Decimal(0),
        email: 'payee_email',
        password: 'payee_password',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
      };

      (prismaService.transaction.findUnique as jest.Mock).mockResolvedValue({
        ...transaction,
        payer,
        payee,
      });

      await expect(
        service.chargeback('payer_id', 'transaction_id'),
      ).rejects.toThrow();
    });
  });
});
