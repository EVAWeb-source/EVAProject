import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  @MinLength(1)
  unitId!: string;

  @IsString()
  @MinLength(10)
  reservationToken!: string;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

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

  @IsOptional()
  @IsBoolean()
  isGift?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  giftMessage?: string;

  @IsOptional()
  @IsBoolean()
  hidePriceInPackage?: boolean;
}
