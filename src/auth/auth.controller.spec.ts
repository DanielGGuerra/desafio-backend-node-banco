import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ResponseUserDTO } from './dto/response-user.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { User } from '@prisma/client';
import { ResponseLoginDTO } from './dto/response-login.dto';

describe('AuthController', () => {
  let controller: AuthController;
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

  const mockLoginDTO = {
    email: 'valid_email',
    password: 'valid_password',
  };

  const mockResponseUserDTO: ResponseUserDTO = {
    id: mockUser.id,
    name: mockUser.name,
    email: mockUser.email,
    balance: mockUser.balance.toString(),
  };

  const mockToken = 'valid_token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            registerUser: jest.fn(),
            generateToken: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
    expect(usersService).toBeDefined();
  });

  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      (service.registerUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await controller.registerUser(mockRegisterDTO);

      expect(result).toEqual(mockResponseUserDTO);
      expect(service.registerUser).toHaveBeenCalledTimes(1);
      expect(service.registerUser).toHaveBeenCalledWith(mockRegisterDTO);
    });

    it('should throw an error if service fails', async () => {
      (service.registerUser as jest.Mock).mockRejectedValue(new Error());

      await expect(controller.registerUser(mockRegisterDTO)).rejects.toThrow();

      expect(service.registerUser).toHaveBeenCalledTimes(1);
      expect(service.registerUser).toHaveBeenCalledWith(mockRegisterDTO);
    });
  });

  describe('login', () => {
    it('should successfully login and return token', async () => {
      (service.generateToken as jest.Mock).mockResolvedValue(mockToken);

      const result = await controller.login(mockLoginDTO, mockUser);

      expect(result).toBeInstanceOf(ResponseLoginDTO);
      expect(result).toEqual({ token: mockToken });
      expect(service.generateToken).toHaveBeenCalledTimes(1);
      expect(service.generateToken).toHaveBeenCalledWith(mockUser);
    });

    it('should throw an error if token generation fails', async () => {
      (service.generateToken as jest.Mock).mockRejectedValue(new Error());

      await expect(controller.login(mockLoginDTO, mockUser)).rejects.toThrow();

      expect(service.generateToken).toHaveBeenCalledTimes(1);
      expect(service.generateToken).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('me', () => {
    it('should return current user information', () => {
      const result = controller.me(mockUser);

      expect(result).toBeInstanceOf(ResponseUserDTO);
      expect(result).toEqual(mockResponseUserDTO);
    });
  });
});
