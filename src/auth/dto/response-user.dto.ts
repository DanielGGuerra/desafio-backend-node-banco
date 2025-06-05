import { User } from '@prisma/client';

export class ResponseUserDTO {
  id: string;
  name: string;
  email: string;
  balance: string;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.balance = user.balance.toString();
  }
}
