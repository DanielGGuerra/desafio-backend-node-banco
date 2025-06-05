import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

interface IHashUtils {
  compare(hash: string, value: string): Promise<boolean>;
  generate(value: string): Promise<string>;
}

@Injectable()
export class HashUtils implements IHashUtils {
  private saltOrRounds = 12;

  async compare(hash: string, value: string): Promise<boolean> {
    return await compare(value, hash);
  }

  async generate(value: string): Promise<string> {
    return await hash(value, this.saltOrRounds);
  }
}
