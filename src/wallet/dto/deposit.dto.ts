import { IsNumber, IsPositive } from 'class-validator';

export class DepositDTO {
  @IsNumber()
  @IsPositive()
  amount: number;
}
