import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterUserDTO {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsNotEmpty()
  @IsEmail()
  @MinLength(1)
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @IsStrongPassword()
  @MinLength(6)
  @MaxLength(20)
  password: string;
}
