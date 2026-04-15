import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Visibility, AccessClassification } from '@prisma/client';

export class SearchDatasetDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsEnum(Visibility)
  @IsOptional()
  visibility?: Visibility;

  @IsEnum(AccessClassification)
  @IsOptional()
  accessClassification?: AccessClassification;

  @IsString()
  @IsOptional()
  owner?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
