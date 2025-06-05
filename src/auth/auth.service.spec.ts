import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  const mockUser: User = {
    id: 'valid_id',
    name: 'valid_name',
    email: 'valid_email',
    password: 'valid_password',
    balance: new Decimal(0),
    createdAt: new Date('2025-06-05T13:00'),
    updatedAt: new Date('2025-06-05T13:00'),
  };

  const mockRegisterDTO = {
    name: 'valid_name',
    email: 'valid_email',
    password: 'valid_password',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(usersService).toBeDefined();
  });

  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      (usersService.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.registerUser(mockRegisterDTO);

      expect(result).toEqual(mockUser);
      expect(usersService.create).toHaveBeenCalledTimes(1);
      expect(usersService.create).toHaveBeenCalledWith(mockRegisterDTO);
    });

    it('should throw error if usersService.create fails', async () => {
      (usersService.create as jest.Mock).mockRejectedValue(new Error());

      await expect(service.registerUser(mockRegisterDTO)).rejects.toThrow();

      expect(usersService.create).toHaveBeenCalledTimes(1);
      expect(usersService.create).toHaveBeenCalledWith(mockRegisterDTO);
    });
  });
});
