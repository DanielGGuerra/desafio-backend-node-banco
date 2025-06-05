import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JWT_SECRET } from './contants';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { HashUtils } from '../common/utils/hash';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, HashUtils],
  controllers: [AuthController],
})
export class AuthModule {}
