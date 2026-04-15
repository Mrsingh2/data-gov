import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional } from 'class-validator';
import { CreateDatasetDto } from './create-dataset.dto';

export class UpdateDatasetDto extends PartialType(CreateDatasetDto) {
  @IsString()
  @IsOptional()
  changeNote?: string;
}
