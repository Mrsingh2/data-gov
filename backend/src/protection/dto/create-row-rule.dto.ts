import { IsString, IsIn } from 'class-validator';

export class CreateRowRuleDto {
  @IsString()
  field: string;

  @IsIn(['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'contains'])
  operator: string;

  @IsString()
  value: string;
}
