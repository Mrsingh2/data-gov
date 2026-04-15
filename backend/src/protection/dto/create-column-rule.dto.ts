import { IsString, IsEnum } from 'class-validator';
import { ProtectionStrategy } from '@prisma/client';

export class CreateColumnRuleDto {
  @IsString()
  columnName: string;

  @IsEnum(ProtectionStrategy)
  strategy: ProtectionStrategy;
}
