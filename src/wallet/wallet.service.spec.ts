import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { UsersService } from '../users/users.service';

describe('WalletService', () => {
  let service: WalletService;
  let usersService: UsersService;

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
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    usersService = module.get<UsersService>(UsersService);
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
});
