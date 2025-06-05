import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { HashUtils } from '../common/utils/hash';

@Module({
  providers: [UsersService, HashUtils],
  exports: [UsersModule],
})
export class UsersModule {}
