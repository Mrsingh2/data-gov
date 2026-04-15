import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateAccessRequestDto {
  @IsString()
  datasetId: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  message?: string;
}
