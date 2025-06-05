import { Injectable } from '@nestjs/common';
import { RegisterUserDTO } from './dto/register-user.dto';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async registerUser(data: RegisterUserDTO): Promise<User> {
    const user = await this.usersService.create(data);
    return user;
  }
}
