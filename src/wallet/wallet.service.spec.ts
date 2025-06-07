import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from 'nestjs-prisma';
import { User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('WalletService', () => {
  let service: WalletService;
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
  });

  describe('balance', () => {
    it('should return the balance of the user', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(userMock);

      const balance = await service.balance('valid_id');

      expect(balance).toBe('100.00');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'valid_id',
        },
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the user is not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.balance('invalid_id')).rejects.toThrow();
      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'invalid_id',
        },
      });
    });
  });
});
