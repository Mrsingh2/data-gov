import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ProtectionService } from './protection.service';
import { CreateColumnRuleDto } from './dto/create-column-rule.dto';
import { CreateRowRuleDto } from './dto/create-row-rule.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('datasets/:datasetId/protection')
export class ProtectionController {
  constructor(private protectionService: ProtectionService) {}

  @Get('columns')
  getColumnRules(@Param('datasetId') datasetId: string) {
    return this.protectionService.getColumnRules(datasetId);
  }

  @Post('columns')
  addColumnRule(
    @Param('datasetId') datasetId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateColumnRuleDto,
  ) {
    return this.protectionService.addColumnRule(datasetId, user.id, dto);
  }

  @Delete('columns/:ruleId')
  deleteColumnRule(
    @Param('datasetId') datasetId: string,
    @Param('ruleId') ruleId: string,
    @CurrentUser() user: any,
  ) {
    return this.protectionService.deleteColumnRule(datasetId, ruleId, user.id);
  }

  @Get('rows')
  getRowRules(@Param('datasetId') datasetId: string) {
    return this.protectionService.getRowRules(datasetId);
  }

  @Post('rows')
  addRowRule(
    @Param('datasetId') datasetId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateRowRuleDto,
  ) {
    return this.protectionService.addRowRule(datasetId, user.id, dto);
  }

  @Delete('rows/:ruleId')
  deleteRowRule(
    @Param('datasetId') datasetId: string,
    @Param('ruleId') ruleId: string,
    @CurrentUser() user: any,
  ) {
    return this.protectionService.deleteRowRule(datasetId, ruleId, user.id);
  }
}
