import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../database/prisma.service';
import { User } from '@prisma/client';
import Decimal from 'decimal.js';
import { CreateUserDTO } from './dto/create-user.dto';
import { HashUtils } from '../common/utils/hash';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let hashUtils: HashUtils;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: HashUtils,
          useValue: {
            compare: jest.fn(),
            generate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    hashUtils = module.get<HashUtils>(HashUtils);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('create', () => {
    it('should throw error if user exists', async () => {
      const data: CreateUserDTO = {
        email: 'valid_email',
        name: 'valid_name',
        password: 'valid_password',
      };

      const userMock: User = {
        id: 'valid_id',
        name: 'valid_name',
        balance: new Decimal(0),
        email: 'valid_email',
        password: 'valid_password',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userMock);
      (hashUtils.generate as jest.Mock).mockResolvedValue('valid_hash');

      await expect(service.create(data)).rejects.toThrow();
    });

    it('should return new user if user data is correct', async () => {
      const data: CreateUserDTO = {
        email: 'valid_email',
        name: 'valid_name',
        password: 'valid_password',
      };

      const userMock: User = {
        id: 'valid_id',
        name: 'valid_name',
        balance: new Decimal(0),
        email: 'valid_email',
        password: 'valid_password',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
      };

      const valid_hash = 'valid_hash';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(userMock);
      (hashUtils.generate as jest.Mock).mockResolvedValue(valid_hash);

      const result = await service.create(data);

      expect(result).toEqual(userMock);

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: data.email },
      });

      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: data.name,
          email: data.email,
          password: valid_hash,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should throw error if not found user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('valid_id')).rejects.toThrow();
    });

    it('should return user if exists user for id', async () => {
      const userMock: User = {
        id: 'valid_id',
        name: 'valid_name',
        balance: new Decimal(0),
        email: 'valid_email',
        password: 'valid_password',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userMock);

      const result = await service.findOne('valid_id');

      expect(result).toEqual(userMock);
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'valid_id',
        },
      });
    });
  });

  describe('findOneByEmail', () => {
    it('should throw error if not found user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOneByEmail('valid_email')).rejects.toThrow();
    });

    it('should return user if exists user for email', async () => {
      const userMock: User = {
        id: 'valid_id',
        name: 'valid_name',
        balance: new Decimal(0),
        email: 'valid_email',
        password: 'valid_password',
        createdAt: new Date('2025-06-05T13:00'),
        updatedAt: new Date('2025-06-05T13:00'),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userMock);

      const result = await service.findOneByEmail('valid_email');

      expect(result).toEqual(userMock);
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: 'valid_email',
        },
      });
    });
  });
});
