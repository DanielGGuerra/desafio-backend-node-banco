import { Injectable } from '@nestjs/common';
import { RegisterUserDTO } from './dto/register-user.dto';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';
import { HashUtils } from '../common/utils/hash';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private hashUtils: HashUtils,
    private jwtService: JwtService,
  ) {}

  async registerUser(data: RegisterUserDTO): Promise<User> {
    const user = await this.usersService.create(data);
    return user;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.hashUtils.compare(
      user.password,
      password,
    );

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async generateToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const token = await this.jwtService.signAsync(payload);

    return token;
  }
}
