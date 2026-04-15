import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Visibility, AccessClassification } from '@prisma/client';

export class CreateDatasetDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsEnum(Visibility)
  @IsOptional()
  visibility?: Visibility;

  @IsEnum(AccessClassification)
  @IsOptional()
  accessClassification?: AccessClassification;
}
