import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { Transaction, User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { UsersService } from '../users/users.service';
import { PrismaService } from 'nestjs-prisma';

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
              create: jest.fn(),
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
});
