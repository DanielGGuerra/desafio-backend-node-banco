import { Body, Controller, Post } from '@nestjs/common';
import { RegisterUserDTO } from './dto/register-user.dto';
import { ResponseUserDTO } from './dto/response-user.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async registerUser(@Body() data: RegisterUserDTO): Promise<ResponseUserDTO> {
    const user = await this.authService.registerUser(data);
    return new ResponseUserDTO(user);
  }
}
