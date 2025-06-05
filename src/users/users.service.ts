import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateUserDTO } from './dto/create-user.dto';

import { HashUtils } from '../common/utils/hash';

import { User } from '@prisma/client';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private hashUtils: HashUtils,
  ) {}

  async create(data: CreateUserDTO): Promise<User> {
    const isExists = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (isExists) {
      throw new BadRequestException(`E-Mail ${data.email} already exists`);
    }

    const hashedPassword = await this.hashUtils.generate(data.password);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });

    return user;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException(`User ${email} not found`);
    }

    return user;
  }
}
