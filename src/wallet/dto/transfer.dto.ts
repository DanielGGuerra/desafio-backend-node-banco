import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class TransferDTO {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  payeeId: string;
}
