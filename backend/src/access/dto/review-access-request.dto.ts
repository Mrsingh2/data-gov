import { IsEnum, IsString, IsOptional } from 'class-validator';

export class ReviewAccessRequestDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @IsString()
  @IsOptional()
  reviewNote?: string;
}
