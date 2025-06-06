import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { HashUtils } from '../common/utils/hash';

@Module({
  imports: [],
  providers: [UsersService, HashUtils],
  exports: [UsersService],
})
export class UsersModule {}
