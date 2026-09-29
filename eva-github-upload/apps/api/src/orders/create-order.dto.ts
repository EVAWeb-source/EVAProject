import { IsString, MinLength } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @MinLength(1)
  unitId!: string;

  @IsString()
  @MinLength(10)
  reservationToken!: string;

  @IsString()
  @MinLength(2)
  customerName!: string;

  @IsString()
  @MinLength(10)
  mobile!: string;

  @IsString()
  @MinLength(2)
  province!: string;

  @IsString()
  @MinLength(2)
  city!: string;

  @IsString()
  @MinLength(5)
  address!: string;

  @IsString()
  @MinLength(5)
  postalCode!: string;

  @IsString()
  @MinLength(2)
  recipientName!: string;
}
