import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { HashUtils } from '../common/utils/hash';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let hashUtils: HashUtils;
  let jwtService: JwtService;

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
          useValue: {
            create: jest.fn(),
            findOneByEmail: jest.fn(),
          },
        },
        {
          provide: HashUtils,
          useValue: {
            compare: jest.fn(),
            generate: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    hashUtils = module.get<HashUtils>(HashUtils);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(usersService).toBeDefined();
    expect(hashUtils).toBeDefined();
    expect(jwtService).toBeDefined();
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

  describe('validateUser', () => {
    it('should return null if user not found', async () => {
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser(
        'valid_email',
        'valid_password',
      );

      expect(result).toBeNull();
      expect(usersService.findOneByEmail).toHaveBeenCalledTimes(1);
      expect(usersService.findOneByEmail).toHaveBeenCalledWith('valid_email');
    });

    it('should return null if password is invalid', async () => {
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(mockUser);
      (hashUtils.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'valid_email',
        'invalid_password',
      );

      expect(result).toBeNull();
      expect(usersService.findOneByEmail).toHaveBeenCalledTimes(1);
      expect(hashUtils.compare).toHaveBeenCalledTimes(1);
      expect(hashUtils.compare).toHaveBeenCalledWith(
        mockUser.password,
        'invalid_password',
      );
    });

    it('should return user if credentials are valid', async () => {
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(mockUser);
      (hashUtils.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'valid_email',
        'valid_password',
      );

      expect(result).toEqual(mockUser);
      expect(usersService.findOneByEmail).toHaveBeenCalledTimes(1);
      expect(hashUtils.compare).toHaveBeenCalledTimes(1);
      expect(hashUtils.compare).toHaveBeenCalledWith(
        mockUser.password,
        'valid_password',
      );
    });
  });

  describe('generateToken', () => {
    const mockToken = 'valid_token';

    it('should successfully generate JWT token', async () => {
      (jwtService.signAsync as jest.Mock).mockResolvedValue(mockToken);

      const result = await service.generateToken(mockUser);

      expect(result).toBe(mockToken);
      expect(jwtService.signAsync).toHaveBeenCalledTimes(1);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });

    it('should throw error if token generation fails', async () => {
      (jwtService.signAsync as jest.Mock).mockRejectedValue(new Error());

      await expect(service.generateToken(mockUser)).rejects.toThrow();

      expect(jwtService.signAsync).toHaveBeenCalledTimes(1);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });
  });
});
