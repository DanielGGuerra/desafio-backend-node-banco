import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RegisterUserDTO } from './dto/register-user.dto';
import { ResponseUserDTO } from './dto/response-user.dto';
import { AuthService } from './auth.service';
import { LocalGuard } from './guards/local.guard';
import { LoginUserDTO } from './dto/login.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { ResponseLoginDTO } from './dto/response-login.dto';
import { JwtGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async registerUser(@Body() data: RegisterUserDTO): Promise<ResponseUserDTO> {
    const user = await this.authService.registerUser(data);
    return new ResponseUserDTO(user);
  }

  @Post('login')
  @UseGuards(LocalGuard)
  async login(
    @Body() _data: LoginUserDTO,
    @GetUser() user: User,
  ): Promise<ResponseLoginDTO> {
    const token = await this.authService.generateToken(user);
    return new ResponseLoginDTO(token);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  me(@GetUser() user: User): ResponseUserDTO {
    return new ResponseUserDTO(user);
  }
}
